// O índice de categorias do jogo. Cada deck é um JSON; aqui eles ganham o grupo
// da vitrine pra tela de seleção (o ícone vem do id do deck, em Icones.tsx). Todo
// deck é VALIDADO na carga — se algum JSON estiver torto, o parseDeck estoura já
// aqui, falhando cedo em vez de quebrar no meio de uma partida.

import type { Deck } from "../tipos";
import { parseDeck } from "../schema";
import populacaoMunicipios from "./ibge-populacao-municipios.json";
import areaEstados from "./ibge-area-estados.json";
import paisesPopulacao from "./paises-populacao.json";
import paisesArea from "./paises-area.json";
import paisesPib from "./paises-pib.json";
import animaisVelocidade from "./animais-velocidade.json";
import filmesBilheteria from "./filmes-bilheteria.json";
import montanhasAltura from "./montanhas-altura.json";
import prediosAltura from "./predios-altura.json";
import planetasDiametro from "./planetas-diametro.json";

export type GrupoDeck = "Brasil" | "Mundo" | "Diversão";

export interface DeckRegistrado {
  deck: Deck;
  grupo: GrupoDeck;
}

const cru: { fonte: unknown; grupo: GrupoDeck }[] = [
  { fonte: populacaoMunicipios, grupo: "Brasil" },
  { fonte: areaEstados, grupo: "Brasil" },
  { fonte: paisesPopulacao, grupo: "Mundo" },
  { fonte: paisesArea, grupo: "Mundo" },
  { fonte: paisesPib, grupo: "Mundo" },
  { fonte: animaisVelocidade, grupo: "Diversão" },
  { fonte: filmesBilheteria, grupo: "Diversão" },
  { fonte: montanhasAltura, grupo: "Diversão" },
  { fonte: prediosAltura, grupo: "Diversão" },
  { fonte: planetasDiametro, grupo: "Diversão" },
];

export const DECKS: DeckRegistrado[] = cru.map((c) => ({
  deck: parseDeck(c.fonte),
  grupo: c.grupo,
}));

/** O deck aberto por padrão (enquanto não há tela de seleção). */
export const deckPadrao: Deck = DECKS[0].deck;

export function acharDeck(id: string): Deck | undefined {
  return DECKS.find((d) => d.deck.id === id)?.deck;
}
