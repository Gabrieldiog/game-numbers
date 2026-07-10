// As mensagens que trafegam entre cliente e servidor no multijogador 1v1.
// Regra de ouro (anti-trapaça): o servidor é o dono da verdade. O cliente só
// manda o palpite; o valor do desafiante só chega DEPOIS, na revelação.

export type Palpite = "maior" | "menor";

export interface RodadaView {
  indice: number;
  total: number;
  deckTitulo: string;
  unidade: string;
  fonte: string;
  fonteUrl: string;
  ancora: { nome: string; valor: number };
  desafiante: { nome: string }; // sem o valor: só revela após o palpite
}

// ---- lobby (matchmaking) ----
export type MsgLobbyCliente = { tipo: "procurar"; nome: string };
export type MsgLobbyServidor =
  | { tipo: "procurando" }
  | { tipo: "achou"; matchId: string; oponente: string };

// ---- sala de jogo ----
export type MsgJogoCliente = { tipo: "palpite"; palpite: Palpite } | { tipo: "rematch" };

export type Resultado = "ganhou" | "perdeu" | "empate";

export type MsgJogoServidor =
  | { tipo: "esperando" } // esperando o oponente conectar
  | { tipo: "comecou"; voce: string; oponente: string; total: number }
  | { tipo: "rodada"; rodada: RodadaView }
  | { tipo: "revelacao"; valor: number; acerto: boolean; meu: number; dele: number }
  | { tipo: "placar"; meu: number; dele: number } // o oponente andou
  | { tipo: "fim"; meu: number; dele: number; resultado: Resultado }
  | { tipo: "oponente_saiu" }
  | { tipo: "aguardando_rematch" }
  | { tipo: "erro"; msg: string };
