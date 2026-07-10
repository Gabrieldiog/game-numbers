import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { comparar, itemAncora, itemDesafiante, jogar, novoJogo, proximoPar, reiniciar } from "../lib/jogo";
import type { Deck, EstadoJogo, ItemDeck, Palpite, Resultado } from "../lib/jogo";
import { som } from "../som/audioEngine";

export type ModoPartida = "classico" | "vidas" | "blitz";
export type Fase = "jogando" | "revelando" | "fim";

const PAUSA_PADRAO = 1100;
const PAUSA_BLITZ = 380;
const VIDAS_MODO = 3;
export const TEMPO_BLITZ = 30;

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
  tempo: number;
  combo: number;
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
  // blitz
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [tempo, setTempo] = useState(TEMPO_BLITZ);
  const [iniciado, setIniciado] = useState(false);

  const timer = useRef<number | null>(null);
  const concluido = useRef(false);
  const pausa = modo === "blitz" ? PAUSA_BLITZ : PAUSA_PADRAO;

  // recorde: clássico/vidas usam a sequência (estado.recorde); blitz usa a pontuação
  useEffect(() => {
    const atual = modo === "blitz" ? score : estado.recorde;
    if (atual > recordeInicial.current) {
      try {
        localStorage.setItem(chaveRecorde(deck.id, modo), String(atual));
      } catch {
        /* ignore */
      }
    }
  }, [estado.recorde, score, modo, deck.id]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  // relógio do blitz: só corre enquanto está "jogando" (pausa no reveal, pra o
  // tempo medir a decisão, não a animação)
  useEffect(() => {
    if (modo !== "blitz" || !iniciado || fase !== "jogando") return;
    const id = window.setInterval(() => setTempo((t) => (t <= 1 ? 0 : t - 1)), 1000);
    return () => window.clearInterval(id);
  }, [modo, iniciado, fase]);

  // acabou o tempo -> fim
  useEffect(() => {
    if (modo === "blitz" && iniciado && tempo === 0 && fase !== "fim") {
      setRecordeBatido(score > recordeInicial.current);
      setFase("fim");
    }
  }, [tempo, modo, iniciado, fase, score]);

  const palpitar = useCallback(
    (p: Palpite) => {
      if (fase !== "jogando") return;
      som.destravar();
      concluido.current = false;
      if (modo === "blitz" && !iniciado) setIniciado(true);
      setResultado(comparar(estado, p));
      setPalpite(p);
      setDesfechoVisivel(false);
      setFase("revelando");
    },
    [fase, estado, modo, iniciado],
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
      if (modo === "blitz") {
        if (resultado.acerto) {
          setCombo((c) => c + 1);
          setScore((s) => s + combo + 1); // combo cresce a pontuação por acerto seguido
        } else {
          setCombo(0);
        }
        if (tempo > 0) {
          setEstado(proximoPar(estado));
          setPalpite(null);
          setResultado(null);
          setDesfechoVisivel(false);
          setFase("jogando");
        }
        return;
      }
      if (resultado.acerto) {
        setEstado(jogar(estado, palpite));
        setPalpite(null);
        setResultado(null);
        setDesfechoVisivel(false);
        setFase("jogando");
        return;
      }
      // errou (clássico/vidas)
      if (modo === "vidas" && vidas > 1) {
        setVidas((v) => v - 1);
        setEstado(proximoPar(estado));
        setPalpite(null);
        setResultado(null);
        setDesfechoVisivel(false);
        setFase("jogando");
      } else {
        if (modo === "vidas") setVidas(0);
        setRecordeBatido(estado.recorde > recordeInicial.current);
        setFase("fim");
      }
    }, pausa);
  }, [fase, palpite, resultado, estado, modo, vidas, combo, tempo, pausa]);

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
    setScore(0);
    setCombo(0);
    setTempo(TEMPO_BLITZ);
    setIniciado(false);
    setFase("jogando");
  }, [deck.id, modo]);

  const ancora = useMemo(() => itemAncora(estado), [estado]);
  const desafiante = useMemo(() => itemDesafiante(estado), [estado]);

  const pontos = modo === "blitz" ? score : estado.pontos;
  const recorde = modo === "blitz" ? Math.max(score, recordeInicial.current) : estado.recorde;

  return {
    ancora,
    desafiante,
    pontos,
    recorde,
    vidas,
    tempo,
    combo,
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
