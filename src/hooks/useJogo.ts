import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { comparar, itemAncora, itemDesafiante, jogar, novoJogo, proximoPar, reiniciar } from "../lib/jogo";
import type { Deck, EstadoJogo, ItemDeck, Palpite, Resultado } from "../lib/jogo";
import { som } from "../som/audioEngine";

export type ModoPartida = "classico" | "vidas";
export type Fase = "jogando" | "revelando" | "fim";

const PAUSA_APOS_CONTAGEM = 1100;
const VIDAS_MODO = 3;

const chaveRecorde = (deckId: string, modo: ModoPartida) => `mm:recorde:${deckId}:${modo}`;

function lerRecorde(deckId: string, modo: ModoPartida): number {
  try {
    const n = parseInt(localStorage.getItem(chaveRecorde(deckId, modo)) ?? "0", 10);
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
  vidas: number;
  modo: ModoPartida;
  fase: Fase;
  resultado: Resultado | null;
  desfechoVisivel: boolean;
  recordeBatido: boolean;
  unidade: string;
  palpitar: (p: Palpite) => void;
  concluirContagem: () => void;
  reiniciarJogo: () => void;
}

export function useJogo(deck: Deck, modo: ModoPartida = "classico"): JogoView {
  const recordeInicial = useRef(lerRecorde(deck.id, modo));
  const [estado, setEstado] = useState<EstadoJogo>(() =>
    novoJogo(deck, { aoEsgotar: "reembaralhar", recorde: recordeInicial.current }),
  );
  const [fase, setFase] = useState<Fase>("jogando");
  const [palpite, setPalpite] = useState<Palpite | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [desfechoVisivel, setDesfechoVisivel] = useState(false);
  const [recordeBatido, setRecordeBatido] = useState(false);
  const [vidas, setVidas] = useState(modo === "vidas" ? VIDAS_MODO : 1);

  const timer = useRef<number | null>(null);
  const concluido = useRef(false);

  useEffect(() => {
    if (estado.recorde > recordeInicial.current) {
      try {
        localStorage.setItem(chaveRecorde(deck.id, modo), String(estado.recorde));
      } catch {
        /* ignore */
      }
    }
  }, [estado.recorde, deck.id, modo]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const palpitar = useCallback(
    (p: Palpite) => {
      if (fase !== "jogando") return;
      som.destravar();
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
      if (resultado.acerto) {
        // acertou: avança e pontua (qualquer modo)
        setEstado(jogar(estado, palpite));
        setPalpite(null);
        setResultado(null);
        setDesfechoVisivel(false);
        setFase("jogando");
        return;
      }
      // errou
      if (modo === "vidas" && vidas > 1) {
        // ainda tem vida: perde uma e a corrente continua, sem pontuar
        setVidas((v) => v - 1);
        setEstado(proximoPar(estado));
        setPalpite(null);
        setResultado(null);
        setDesfechoVisivel(false);
        setFase("jogando");
      } else {
        // clássico, ou a última vida: fim
        if (modo === "vidas") setVidas(0);
        setRecordeBatido(estado.recorde > recordeInicial.current);
        setFase("fim");
      }
    }, PAUSA_APOS_CONTAGEM);
  }, [fase, palpite, resultado, estado, modo, vidas]);

  const reiniciarJogo = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    recordeInicial.current = lerRecorde(deck.id, modo);
    concluido.current = false;
    setEstado((e) => reiniciar(e));
    setPalpite(null);
    setResultado(null);
    setDesfechoVisivel(false);
    setRecordeBatido(false);
    setVidas(modo === "vidas" ? VIDAS_MODO : 1);
    setFase("jogando");
  }, [deck.id, modo]);

  const ancora = useMemo(() => itemAncora(estado), [estado]);
  const desafiante = useMemo(() => itemDesafiante(estado), [estado]);

  return {
    ancora,
    desafiante,
    pontos: estado.pontos,
    recorde: estado.recorde,
    vidas,
    modo,
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
