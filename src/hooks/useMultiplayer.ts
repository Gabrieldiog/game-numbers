import { useCallback, useEffect, useRef, useState } from "react";
import { PartySocket } from "partysocket";
import type { MsgJogoServidor, MsgLobbyServidor, Palpite, Resultado, RodadaView } from "../../party/protocolo";
import { PARTY_HOST } from "../lib/multiplayer/host";
import { som } from "../som/audioEngine";

export type FaseMulti = "nome" | "procurando" | "esperando" | "jogando" | "revelando" | "fim" | "saiu";

const PAUSA = 1050;

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
  total: 10,
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
  const lobbyRef = useRef<PartySocket | null>(null);
  const gameRef = useRef<PartySocket | null>(null);
  const proximaRef = useRef<RodadaView | null>(null);
  const revelacaoRef = useRef<{ valor: number; acerto: boolean } | null>(null);
  const timerRef = useRef<number | null>(null);
  const concluidoRef = useRef(false);
  const nomeRef = useRef("");

  const limpar = useCallback(() => {
    lobbyRef.current?.close();
    lobbyRef.current = null;
    gameRef.current?.close();
    gameRef.current = null;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    proximaRef.current = null;
    revelacaoRef.current = null;
  }, []);

  useEffect(() => () => limpar(), [limpar]);

  const trataJogo = useCallback((m: MsgJogoServidor) => {
    switch (m.tipo) {
      case "comecou":
        proximaRef.current = null;
        revelacaoRef.current = null;
        setSt((s) => ({
          ...s,
          oponente: m.oponente,
          total: m.total,
          meuScore: 0,
          oppScore: 0,
          resultado: null,
          aguardandoRematch: false,
          revelacao: null,
          desfechoVisivel: false,
          fase: "esperando",
        }));
        break;
      case "rodada":
        setSt((s) => {
          if (s.fase === "revelando") {
            proximaRef.current = m.rodada; // chega durante o reveal: guarda pra depois
            return s;
          }
          return { ...s, fase: "jogando", rodada: m.rodada, revelacao: null, desfechoVisivel: false };
        });
        break;
      case "revelacao":
        revelacaoRef.current = { valor: m.valor, acerto: m.acerto };
        setSt((s) => ({ ...s, revelacao: { valor: m.valor, acerto: m.acerto }, meuScore: m.meu, oppScore: m.dele }));
        break;
      case "placar":
        setSt((s) => ({ ...s, meuScore: m.meu, oppScore: m.dele }));
        break;
      case "fim":
        if (timerRef.current) window.clearTimeout(timerRef.current);
        setSt((s) => ({ ...s, fase: "fim", meuScore: m.meu, oppScore: m.dele, resultado: m.resultado }));
        break;
      case "oponente_saiu":
        if (timerRef.current) window.clearTimeout(timerRef.current);
        setSt((s) => ({ ...s, fase: "saiu" }));
        break;
      case "aguardando_rematch":
        setSt((s) => ({ ...s, aguardandoRematch: true }));
        break;
    }
  }, []);

  const conectarJogo = useCallback(
    (matchId: string, nome: string) => {
      gameRef.current?.close();
      const g = new PartySocket({ host: PARTY_HOST, party: "main", room: matchId, query: { nome } });
      g.addEventListener("message", (e) => trataJogo(JSON.parse(e.data as string) as MsgJogoServidor));
      gameRef.current = g;
    },
    [trataJogo],
  );

  const procurar = useCallback(
    (nomeBruto: string) => {
      const nome = nomeBruto.trim().slice(0, 20) || "Jogador";
      nomeRef.current = nome;
      lobbyRef.current?.close();
      gameRef.current?.close();
      gameRef.current = null;
      proximaRef.current = null;
      revelacaoRef.current = null;
      setSt({ ...INICIAL, nome, fase: "procurando" });

      const l = new PartySocket({ host: PARTY_HOST, party: "lobby", room: "fila" });
      l.addEventListener("open", () => l.send(JSON.stringify({ tipo: "procurar", nome })));
      l.addEventListener("message", (e) => {
        const m = JSON.parse(e.data as string) as MsgLobbyServidor;
        if (m.tipo === "achou") {
          l.close();
          lobbyRef.current = null;
          setSt((s) => ({ ...s, oponente: m.oponente, fase: "esperando" }));
          conectarJogo(m.matchId, nome);
        }
      });
      lobbyRef.current = l;
    },
    [conectarJogo],
  );

  const cancelar = useCallback(() => {
    limpar();
    setSt(INICIAL);
  }, [limpar]);

  const palpitar = useCallback((p: Palpite) => {
    setSt((s) => {
      if (s.fase !== "jogando") return s;
      concluidoRef.current = false;
      som.destravar();
      gameRef.current?.send(JSON.stringify({ tipo: "palpite", palpite: p }));
      return { ...s, fase: "revelando", desfechoVisivel: false };
    });
  }, []);

  const concluirContagem = useCallback(() => {
    if (concluidoRef.current) return;
    concluidoRef.current = true;
    const rev = revelacaoRef.current;
    if (rev) {
      if (rev.acerto) som.acerto(Math.min(Math.log10(Math.abs(rev.valor) + 1) / 9, 1));
      else som.erro();
    }
    setSt((s) => ({ ...s, desfechoVisivel: true }));
    timerRef.current = window.setTimeout(() => {
      setSt((s) => {
        const prox = proximaRef.current;
        if (prox) {
          proximaRef.current = null;
          revelacaoRef.current = null;
          return { ...s, fase: "jogando", rodada: prox, revelacao: null, desfechoVisivel: false };
        }
        return s; // última rodada: espera o "fim" do servidor
      });
    }, PAUSA);
  }, []);

  const rematch = useCallback(() => {
    gameRef.current?.send(JSON.stringify({ tipo: "rematch" }));
    setSt((s) => ({ ...s, aguardandoRematch: true }));
  }, []);

  const procurarOutro = useCallback(() => {
    procurar(nomeRef.current || "Jogador");
  }, [procurar]);

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
