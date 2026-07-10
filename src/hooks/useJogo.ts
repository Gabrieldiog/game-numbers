import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { comparar, itemAncora, itemDesafiante, jogar, novoJogo, reiniciar } from "../lib/jogo";
import type { Deck, EstadoJogo, ItemDeck, Palpite, Resultado } from "../lib/jogo";
import { som } from "../som/audioEngine";

export type Fase = "jogando" | "revelando" | "fim";

// tempo mostrando a cor/fato do resultado antes de avançar (ou encerrar)
const PAUSA_APOS_CONTAGEM = 1100;

const chaveRecorde = (deckId: string) => `mm:recorde:${deckId}`;

function lerRecorde(deckId: string): number {
  try {
    const n = parseInt(localStorage.getItem(chaveRecorde(deckId)) ?? "0", 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export interface JogoView {
  ancora: ItemDeck;
  desafiante: ItemDeck;
  pontos: number;
  recorde: number;
  fase: Fase;
  resultado: Resultado | null;
  desfechoVisivel: boolean;
  recordeBatido: boolean;
  unidade: string;
  palpitar: (p: Palpite) => void;
  concluirContagem: () => void;
  reiniciarJogo: () => void;
}

export function useJogo(deck: Deck): JogoView {
  const recordeInicial = useRef(lerRecorde(deck.id));
  const [estado, setEstado] = useState<EstadoJogo>(() =>
    novoJogo(deck, { aoEsgotar: "reembaralhar", recorde: recordeInicial.current }),
  );
  const [fase, setFase] = useState<Fase>("jogando");
  const [palpite, setPalpite] = useState<Palpite | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [desfechoVisivel, setDesfechoVisivel] = useState(false);
  const [recordeBatido, setRecordeBatido] = useState(false);

  const timer = useRef<number | null>(null);
  const concluido = useRef(false); // garante que a contagem resolve uma vez só

  // persiste o recorde sempre que ele sobe
  useEffect(() => {
    if (estado.recorde > recordeInicial.current) {
      try {
        localStorage.setItem(chaveRecorde(deck.id), String(estado.recorde));
      } catch {
        /* ignore */
      }
    }
  }, [estado.recorde, deck.id]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const palpitar = useCallback(
    (p: Palpite) => {
      if (fase !== "jogando") return;
      som.destravar(); // gesto do usuário: libera o áudio
      concluido.current = false;
      setResultado(comparar(estado, p));
      setPalpite(p);
      setDesfechoVisivel(false);
      setFase("revelando");
    },
    [fase, estado],
  );

  const concluirContagem = useCallback(() => {
    if (concluido.current || fase !== "revelando" || !palpite || !resultado) return;
    concluido.current = true;
    setDesfechoVisivel(true);

    if (resultado.acerto) {
      const magnitude = Math.min(Math.log10(Math.abs(resultado.valorDesafiante) + 1) / 9, 1);
      som.acerto(magnitude);
    } else {
      som.erro();
    }

    timer.current = window.setTimeout(() => {
      const prox = jogar(estado, palpite);
      setEstado(prox);
      if (prox.fim) {
        setRecordeBatido(prox.recorde > recordeInicial.current);
        setFase("fim");
      } else {
        setPalpite(null);
        setResultado(null);
        setDesfechoVisivel(false);
        setFase("jogando");
      }
    }, PAUSA_APOS_CONTAGEM);
  }, [fase, palpite, resultado, estado]);

  const reiniciarJogo = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    recordeInicial.current = lerRecorde(deck.id);
    concluido.current = false;
    setEstado((e) => reiniciar(e));
    setPalpite(null);
    setResultado(null);
    setDesfechoVisivel(false);
    setRecordeBatido(false);
    setFase("jogando");
  }, [deck.id]);

  const ancora = useMemo(() => itemAncora(estado), [estado]);
  const desafiante = useMemo(() => itemDesafiante(estado), [estado]);

  return {
    ancora,
    desafiante,
    pontos: estado.pontos,
    recorde: estado.recorde,
    fase,
    resultado,
    desfechoVisivel,
    recordeBatido,
    unidade: deck.unidade,
    palpitar,
    concluirContagem,
    reiniciarJogo,
  };
}
