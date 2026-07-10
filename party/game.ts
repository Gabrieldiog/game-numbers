// A sala de jogo: o ÁRBITRO da partida. Vive num Durable Object por matchId, então
// o estado é autoritativo e single-threaded. Gera a sequência de rodadas de forma
// determinística pelo id da sala (reaproveitando o motor do desafio diário), guarda
// o valor secreto de cada desafiante, valida os palpites e sincroniza o placar.

import type * as Party from "partykit/server";
import { montarDesafioDiario, type RodadaDiaria } from "../src/lib/jogo/diario";
import { DECKS } from "../src/lib/jogo/decks/registro";
import type { MsgJogoCliente, MsgJogoServidor, RodadaView } from "./protocolo";

const TOTAL = 10;

interface Jogador {
  connId: string;
  nome: string;
  score: number;
  indice: number;
  terminou: boolean;
  querRematch: boolean;
}

export default class Jogo implements Party.Server {
  rodadas: RodadaDiaria[] = [];
  jogadores = new Map<string, Jogador>();
  geracao = 0; // muda a cada rematch pra a sequência variar

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const nome = (new URL(ctx.request.url).searchParams.get("nome") || "Jogador").slice(0, 20).trim() || "Jogador";
    if (this.jogadores.size >= 2 && !this.jogadores.has(conn.id)) {
      this.enviar(conn, { tipo: "erro", msg: "Esta partida já está cheia." });
      conn.close();
      return;
    }
    this.jogadores.set(conn.id, { connId: conn.id, nome, score: 0, indice: 0, terminou: false, querRematch: false });
    this.enviar(conn, { tipo: "esperando" });
    if (this.jogadores.size === 2) this.comecar();
  }

  onMessage(raw: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof raw !== "string") return;
    let msg: MsgJogoCliente;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    const j = this.jogadores.get(sender.id);
    if (!j) return;

    if (msg.tipo === "palpite") {
      if (j.terminou || j.indice >= this.rodadas.length) return;
      const r = this.rodadas[j.indice];
      const realMaior = r.desafiante.valor > r.ancora.valor;
      const acerto = (msg.palpite === "maior") === realMaior;
      if (acerto) j.score += 1;
      j.indice += 1;

      const op = this.outro(sender.id);
      this.enviar(sender, { tipo: "revelacao", valor: r.desafiante.valor, acerto, meu: j.score, dele: op?.score ?? 0 });
      // avisa o oponente do novo placar (visão dele: meu = score dele, dele = score deste jogador)
      if (op) this.enviarPara(op.connId, { tipo: "placar", meu: op.score, dele: j.score });

      if (j.indice >= TOTAL) {
        j.terminou = true;
        this.talvezFim();
      } else {
        this.enviar(sender, { tipo: "rodada", rodada: this.view(j.indice) });
      }
      return;
    }

    if (msg.tipo === "rematch") {
      j.querRematch = true;
      const op = this.outro(sender.id);
      if (op && op.querRematch) {
        this.geracao += 1;
        this.comecar();
      } else {
        this.enviar(sender, { tipo: "aguardando_rematch" });
      }
    }
  }

  onClose(conn: Party.Connection) {
    if (!this.jogadores.delete(conn.id)) return;
    const restante = [...this.jogadores.values()][0];
    if (restante) this.enviarPara(restante.connId, { tipo: "oponente_saiu" });
  }

  // ---- interno ----

  private comecar() {
    this.rodadas = montarDesafioDiario(
      DECKS.map((d) => d.deck),
      `${this.room.id}#${this.geracao}`,
      TOTAL,
    );
    for (const j of this.jogadores.values()) {
      j.score = 0;
      j.indice = 0;
      j.terminou = false;
      j.querRematch = false;
      const op = this.outro(j.connId);
      this.enviarPara(j.connId, { tipo: "comecou", voce: j.nome, oponente: op?.nome ?? "?", total: TOTAL });
      this.enviarPara(j.connId, { tipo: "rodada", rodada: this.view(0) });
    }
  }

  private talvezFim() {
    const todos = [...this.jogadores.values()];
    if (todos.length === 2 && todos.every((j) => j.terminou)) {
      for (const j of todos) {
        const op = this.outro(j.connId)!;
        const resultado = j.score > op.score ? "ganhou" : j.score < op.score ? "perdeu" : "empate";
        this.enviarPara(j.connId, { tipo: "fim", meu: j.score, dele: op.score, resultado });
      }
    }
  }

  private view(indice: number): RodadaView {
    const r = this.rodadas[indice];
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

  private outro(connId: string): Jogador | undefined {
    for (const j of this.jogadores.values()) if (j.connId !== connId) return j;
    return undefined;
  }

  private enviar(conn: Party.Connection, msg: MsgJogoServidor) {
    conn.send(JSON.stringify(msg));
  }

  private enviarPara(connId: string, msg: MsgJogoServidor) {
    this.room.getConnection(connId)?.send(JSON.stringify(msg));
  }
}
