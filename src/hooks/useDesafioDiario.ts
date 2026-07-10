import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Palpite } from "../lib/jogo";
import { DECKS } from "../lib/jogo/decks/registro";
import { dataLocalISO, montarDesafioDiario, TOTAL_DIARIO, type RodadaDiaria } from "../lib/jogo/diario";
import { som } from "../som/audioEngine";

const PAUSA = 1050; // tempo mostrando a cor/fato antes de ir pra próxima rodada
const chave = (iso: string) => `mm:diario:${iso}`;

function lerSalvo(iso: string): boolean[] | null {
  try {
    const raw = localStorage.getItem(chave(iso));
    if (!raw) return null;
    const p = JSON.parse(raw) as { respostas?: unknown };
    return Array.isArray(p?.respostas) ? (p.respostas as boolean[]) : null;
  } catch {
    return null;
  }
}

export interface DiarioView {
  iso: string;
  total: number;
  indice: number;
  respostas: boolean[];
  rodada: RodadaDiaria | null;
  fase: "jogando" | "revelando" | "fim";
  desfechoVisivel: boolean;
  acertoAtual: boolean | null;
  jaJogou: boolean;
  palpitar: (p: Palpite) => void;
  concluirContagem: () => void;
}

export function useDesafioDiario(): DiarioView {
  const iso = useMemo(() => dataLocalISO(new Date()), []);
  const rodadas = useMemo(() => montarDesafioDiario(DECKS.map((d) => d.deck), iso), [iso]);
  const salvo = useRef(lerSalvo(iso));

  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<boolean[]>(salvo.current ?? []);
  const [fase, setFase] = useState<"jogando" | "revelando" | "fim">(salvo.current ? "fim" : "jogando");
  const [desfechoVisivel, setDesfechoVisivel] = useState(false);
  const [acertoAtual, setAcertoAtual] = useState<boolean | null>(null);
  const jaJogou = salvo.current != null;

  const timer = useRef<number | null>(null);
  const concluido = useRef(false);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const rodada = fase === "fim" || indice >= rodadas.length ? null : rodadas[indice];

  const palpitar = useCallback(
    (p: Palpite) => {
      if (fase !== "jogando" || !rodada) return;
      som.destravar();
      concluido.current = false;
      const realMaior = rodada.desafiante.valor > rodada.ancora.valor;
      setAcertoAtual((p === "maior") === realMaior);
      setDesfechoVisivel(false);
      setFase("revelando");
    },
    [fase, rodada],
  );

  const concluirContagem = useCallback(() => {
    if (concluido.current || fase !== "revelando" || acertoAtual == null || !rodada) return;
    concluido.current = true;
    setDesfechoVisivel(true);
    if (acertoAtual) {
      const mag = Math.min(Math.log10(Math.abs(rodada.desafiante.valor) + 1) / 9, 1);
      som.acerto(mag);
    } else {
      som.erro();
    }

    timer.current = window.setTimeout(() => {
      const novas = [...respostas, acertoAtual];
      setRespostas(novas);
      if (indice + 1 >= rodadas.length) {
        try {
          localStorage.setItem(chave(iso), JSON.stringify({ respostas: novas }));
        } catch {
          /* ignore */
        }
        setFase("fim");
      } else {
        setIndice((i) => i + 1);
        setAcertoAtual(null);
        setDesfechoVisivel(false);
        setFase("jogando");
      }
    }, PAUSA);
  }, [fase, acertoAtual, rodada, respostas, indice, rodadas.length, iso]);

  return {
    iso,
    total: rodadas.length || TOTAL_DIARIO,
    indice,
    respostas,
    rodada,
    fase,
    desfechoVisivel,
    acertoAtual,
    jaJogou,
    palpitar,
    concluirContagem,
  };
}
