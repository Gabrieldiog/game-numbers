// O lobby: uma sala única (id fixo "fila") que segura uma fila FIFO de quem está
// procurando. Como o Durable Object processa as mensagens em SÉRIE, a corrida
// clássica ("dois pegam o mesmo oponente") não acontece — some por construção.

import type * as Party from "partykit/server";
import type { MsgLobbyCliente, MsgLobbyServidor } from "./protocolo";

interface Ticket {
  connId: string;
  nome: string;
}

export default class Lobby implements Party.Server {
  fila: Ticket[] = [];

  constructor(readonly room: Party.Room) {}

  onMessage(raw: string | ArrayBuffer, sender: Party.Connection) {
    if (typeof raw !== "string") return;
    let msg: MsgLobbyCliente;
    try {
      msg = JSON.parse(raw);
    } catch {
      return;
    }
    if (msg.tipo !== "procurar") return;

    const nome = (msg.nome || "Jogador").toString().slice(0, 20).trim() || "Jogador";
    // tira qualquer ticket velho deste mesmo jogador
    this.fila = this.fila.filter((t) => t.connId !== sender.id);

    // acha o primeiro oponente com conexão viva
    let oponente: Ticket | undefined;
    while ((oponente = this.fila.shift())) {
      if (oponente.connId === sender.id) continue;
      const opConn = this.room.getConnection(oponente.connId);
      if (opConn) {
        const matchId = crypto.randomUUID();
        this.enviar(sender, { tipo: "achou", matchId, oponente: oponente.nome });
        this.enviar(opConn, { tipo: "achou", matchId, oponente: nome });
        return;
      }
      // ticket morto (conexão caiu): descarta e tenta o próximo
    }

    this.fila.push({ connId: sender.id, nome });
    this.enviar(sender, { tipo: "procurando" });
  }

  onClose(conn: Party.Connection) {
    this.fila = this.fila.filter((t) => t.connId !== conn.id);
  }

  private enviar(conn: Party.Connection, msg: MsgLobbyServidor) {
    conn.send(JSON.stringify(msg));
  }
}
