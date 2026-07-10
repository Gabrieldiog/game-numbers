// As mensagens do modo 1v1 rodando sobre o relay do Balcão.
//
// O relay NÃO é árbitro: ele só junta dois jogadores e repassa strings de um pro
// outro. Quem gera as rodadas e conta o placar é o cliente — as duas pontas
// geram a MESMA sequência a partir da semente da sala (o mesmo motor do desafio
// diário), e trocam só placar, fim e rematch. É casual e client-side de
// propósito; sem servidor-dono-da-verdade, dá pra "trapacear" pra si mesmo, mas
// pra um joguinho de portfólio isso é aceitável e mantém o Balcão leve.

export type Palpite = "maior" | "menor";
export type Resultado = "ganhou" | "perdeu" | "empate";

// O que a UI precisa de cada rodada. O valor do desafiante fica de fora daqui:
// só aparece na revelação, depois do palpite (é o que mantém a graça do jogo).
export interface RodadaView {
  indice: number;
  total: number;
  deckTitulo: string;
  unidade: string;
  fonte: string;
  fonteUrl: string;
  ancora: { nome: string; valor: number; img?: string };
  desafiante: { nome: string; img?: string };
}

// Controle, emitido pelo servidor (o relay do Balcão).
export type MsgServidor =
  | { tipo: "procurando" }
  | { tipo: "achou"; sala: string; oponente: string }
  | { tipo: "oponente_saiu" };

// Jogo, trocado entre os dois clientes (passa reto pelo relay).
export type MsgPar =
  | { tipo: "progresso"; score: number } // andei uma rodada: eis meu placar
  | { tipo: "terminei"; score: number } // acabei minhas rodadas, placar final
  | { tipo: "rematch" }; // topo jogar de novo
