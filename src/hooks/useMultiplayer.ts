import { useEffect, useRef, useState } from "react";
import { montarDesafioDiario, type RodadaDiaria } from "../lib/jogo/diario";
import { DECKS } from "../lib/jogo/decks/registro";
import type { MsgPar, MsgServidor, Palpite, Resultado, RodadaView } from "../lib/multiplayer/protocolo";
import { BALCAO_WS } from "../lib/multiplayer/host";
import { som } from "../som/audioEngine";

export type FaseMulti =
  | "nome"
  | "acordando" // conectando no Balcão (que pode estar dormindo no free tier)
  | "procurando"
  | "esperando"
  | "jogando"
  | "revelando"
  | "fim"
  | "saiu"
  | "cochilou"; // não deu pra conectar / o servidor não acordou

const TOTAL = 10;
const PAUSA = 1050; // respiro entre revelar a carta e a próxima rodada
const ABERTURA = 850; // "Achou! vs X" antes da 1ª carta cair

const DECKS_JOGO = DECKS.map((d) => d.deck);

export interface MultiView {
  fase: FaseMulti;
  nome: string;
  oponente: string;
  total: number;
  rodada: RodadaView | null;
  meuScore: number;
  oppScore: number;
  revelacao: { valor: number; acerto: boolean } | null;
  desfechoVisivel: boolean;
  resultado: Resultado | null;
  aguardandoRematch: boolean;
  procurar: (nome: string) => void;
  cancelar: () => void;
  palpitar: (p: Palpite) => void;
  concluirContagem: () => void;
  rematch: () => void;
  procurarOutro: () => void;
}

interface Estado {
  fase: FaseMulti;
  nome: string;
  oponente: string;
  total: number;
  rodada: RodadaView | null;
  meuScore: number;
  oppScore: number;
  revelacao: { valor: number; acerto: boolean } | null;
  desfechoVisivel: boolean;
  resultado: Resultado | null;
  aguardandoRematch: boolean;
}

const INICIAL: Estado = {
  fase: "nome",
  nome: "",
  oponente: "",
  total: TOTAL,
  rodada: null,
  meuScore: 0,
  oppScore: 0,
  revelacao: null,
  desfechoVisivel: false,
  resultado: null,
  aguardandoRematch: false,
};

export function useMultiplayer(): MultiView {
  const [st, setSt] = useState<Estado>(INICIAL);

  // O árbitro mora todo em refs: o Balcão só repassa mensagens, então é o cliente
  // que guarda as rodadas, o índice atual e o placar. Refs (e não estado) porque
  // esses valores são lidos dentro de callbacks de socket/timer, onde o estado
  // do React seria uma foto velha.
  const wsRef = useRef<WebSocket | null>(null);
  const faseRef = useRef<FaseMulti>("nome");
  const salaRef = useRef("");
  const geracaoRef = useRef(0); // muda a cada rematch pra a sequência variar
  const nomeRef = useRef("");
  const rodadasRef = useRef<RodadaDiaria[]>([]);
  const indiceRef = useRef(0);
  const meuScoreRef = useRef(0);
  const revelacaoRef = useRef<{ valor: number; acerto: boolean } | null>(null);
  const timerRef = useRef<number | null>(null);
  const concluidoRef = useRef(false);
  const meuTermineiRef = useRef(false);
  const oppTermineiRef = useRef(false);
  const oppFinalRef = useRef(0);
  const querRematchRef = useRef(false);
  const oppQuerRematchRef = useRef(false);

  // faseRef acompanha o estado pra os guards (ex.: ignorar clique duplo) lerem a
  // fase atual sem esperar o re-render.
  useEffect(() => {
    faseRef.current = st.fase;
  }, [st.fase]);

  useEffect(() => {
    return () => {
      fecharWs();
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fecharWs() {
    const ws = wsRef.current;
    wsRef.current = null; // zera antes de fechar: o handler de close ignora
    if (ws) try { ws.close(); } catch { /* já era */ }
  }

  function enviarPar(m: MsgPar) {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(m));
  }

  function view(indice: number): RodadaView {
    const r = rodadasRef.current[indice];
    return {
      indice,
      total: TOTAL,
      deckTitulo: r.deckTitulo,
      unidade: r.unidade,
      fonte: r.fonte,
      fonteUrl: r.fonteUrl,
      ancora: { nome: r.ancora.nome, valor: r.ancora.valor },
      desafiante: { nome: r.desafiante.nome },
    };
  }

  // Gera (ou regenera, no rematch) as rodadas da sala. As duas pontas usam a mesma
  // semente `${sala}#${geracao}`, então caem exatamente na mesma sequência.
  function iniciarPartida() {
    rodadasRef.current = montarDesafioDiario(DECKS_JOGO, `${salaRef.current}#${geracaoRef.current}`, TOTAL);
    indiceRef.current = 0;
    meuScoreRef.current = 0;
    revelacaoRef.current = null;
    concluidoRef.current = false;
    meuTermineiRef.current = false;
    oppTermineiRef.current = false;
    oppFinalRef.current = 0;
    querRematchRef.current = false;
    oppQuerRematchRef.current = false;
    if (timerRef.current) window.clearTimeout(timerRef.current);

    // beat de abertura: mostra "Achou! vs X" e só então solta a 1ª carta
    setSt((s) => ({
      ...s,
      fase: "esperando",
      meuScore: 0,
      oppScore: 0,
      rodada: null,
      revelacao: null,
      desfechoVisivel: false,
      resultado: null,
      aguardandoRematch: false,
    }));
    timerRef.current = window.setTimeout(() => {
      setSt((s) => ({ ...s, fase: "jogando", rodada: view(0) }));
    }, ABERTURA);
  }

  function finalizar() {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    const meu = meuScoreRef.current;
    const dele = oppFinalRef.current;
    const resultado: Resultado = meu > dele ? "ganhou" : meu < dele ? "perdeu" : "empate";
    setSt((s) => ({ ...s, fase: "fim", meuScore: meu, oppScore: dele, resultado, aguardandoRematch: false }));
  }

  // Rematch só rola quando OS DOIS toparam. Como iniciarPartida zera os flags, uma
  // segunda chamada não dispara a partida de novo.
  function tentarRematch() {
    if (querRematchRef.current && oppQuerRematchRef.current) {
      geracaoRef.current += 1;
      iniciarPartida();
    }
  }

  function tratar(raw: string) {
    let m: MsgServidor | MsgPar;
    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }
    switch (m.tipo) {
      case "procurando":
        setSt((s) => ({ ...s, fase: "procurando" }));
        break;
      case "achou":
        salaRef.current = m.sala;
        geracaoRef.current = 0;
        setSt((s) => ({ ...s, oponente: m.oponente }));
        iniciarPartida();
        break;
      case "oponente_saiu":
        if (timerRef.current) window.clearTimeout(timerRef.current);
        setSt((s) => (s.fase === "fim" ? s : { ...s, fase: "saiu" }));
        break;
      case "progresso":
        setSt((s) => ({ ...s, oppScore: m.score }));
        break;
      case "terminei":
        oppTermineiRef.current = true;
        oppFinalRef.current = m.score;
        setSt((s) => ({ ...s, oppScore: m.score }));
        if (meuTermineiRef.current) finalizar();
        break;
      case "rematch":
        oppQuerRematchRef.current = true;
        tentarRematch();
        break;
    }
  }

  function procurar(nomeBruto: string) {
    const nome = nomeBruto.trim().slice(0, 20) || "Jogador";
    nomeRef.current = nome;
    fecharWs();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    geracaoRef.current = 0;
    faseRef.current = "acordando";
    setSt({ ...INICIAL, nome, fase: "acordando" });

    const ws = new WebSocket(`${BALCAO_WS}?nome=${encodeURIComponent(nome)}`);
    wsRef.current = ws;
    ws.addEventListener("message", (e) => tratar(e.data as string));
    ws.addEventListener("close", () => {
      // só reage ao fechamento do socket ATUAL; um socket já trocado é ignorado
      if (wsRef.current !== ws) return;
      wsRef.current = null;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      setSt((s) => {
        // caiu antes de parear (ou o servidor não acordou): "cochilou".
        if (s.fase === "acordando" || s.fase === "procurando") return { ...s, fase: "cochilou" };
        // caiu no meio da partida: encerra como se o oponente tivesse ido embora.
        if (s.fase === "fim" || s.fase === "saiu" || s.fase === "cochilou" || s.fase === "nome") return s;
        return { ...s, fase: "saiu" };
      });
    });
    // o onopen não precisa fazer nada: o Balcão manda "procurando"/"achou" sozinho
    // assim que a conexão sobe.
  }

  function cancelar() {
    fecharWs();
    if (timerRef.current) window.clearTimeout(timerRef.current);
    faseRef.current = "nome";
    setSt(INICIAL);
  }

  function palpitar(p: Palpite) {
    if (faseRef.current !== "jogando") return;
    const r = rodadasRef.current[indiceRef.current];
    if (!r) return;
    faseRef.current = "revelando"; // trava clique duplo já, sem esperar o render
    concluidoRef.current = false;
    som.destravar();
    const realMaior = r.desafiante.valor > r.ancora.valor;
    const acerto = (p === "maior") === realMaior;
    if (acerto) meuScoreRef.current += 1;
    revelacaoRef.current = { valor: r.desafiante.valor, acerto };
    enviarPar({ tipo: "progresso", score: meuScoreRef.current });
    setSt((s) => ({
      ...s,
      fase: "revelando",
      desfechoVisivel: false,
      revelacao: { valor: r.desafiante.valor, acerto },
      meuScore: meuScoreRef.current,
    }));
  }

  function concluirContagem() {
    if (concluidoRef.current) return;
    concluidoRef.current = true;
    const rev = revelacaoRef.current;
    if (rev) {
      if (rev.acerto) som.acerto(Math.min(Math.log10(Math.abs(rev.valor) + 1) / 9, 1));
      else som.erro();
    }
    setSt((s) => ({ ...s, desfechoVisivel: true }));
    timerRef.current = window.setTimeout(() => {
      const prox = indiceRef.current + 1;
      indiceRef.current = prox;
      if (prox >= TOTAL) {
        // terminei minhas rodadas: conta pro oponente e espera ele acabar
        meuTermineiRef.current = true;
        enviarPar({ tipo: "terminei", score: meuScoreRef.current });
        if (oppTermineiRef.current) finalizar();
        // senão fica na tela da última revelação até o "terminei" dele chegar
      } else {
        revelacaoRef.current = null;
        faseRef.current = "jogando";
        setSt((s) => ({ ...s, fase: "jogando", rodada: view(prox), revelacao: null, desfechoVisivel: false }));
      }
    }, PAUSA);
  }

  function rematch() {
    querRematchRef.current = true;
    enviarPar({ tipo: "rematch" });
    setSt((s) => ({ ...s, aguardandoRematch: true }));
    tentarRematch();
  }

  function procurarOutro() {
    procurar(nomeRef.current || "Jogador");
  }

  return {
    fase: st.fase,
    nome: st.nome,
    oponente: st.oponente,
    total: st.total,
    rodada: st.rodada,
    meuScore: st.meuScore,
    oppScore: st.oppScore,
    revelacao: st.revelacao,
    desfechoVisivel: st.desfechoVisivel,
    resultado: st.resultado,
    aguardandoRematch: st.aguardandoRematch,
    procurar,
    cancelar,
    palpitar,
    concluirContagem,
    rematch,
    procurarOutro,
  };
}
