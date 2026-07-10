// O índice de categorias do jogo. Cada deck é um JSON; aqui eles ganham um pouco
// de metadado de vitrine (emoji e grupo) pra tela de seleção. Todo deck é
// VALIDADO na carga — se algum JSON estiver torto, o parseDeck estoura já aqui,
// falhando cedo em vez de quebrar no meio de uma partida.

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
  emoji: string;
  grupo: GrupoDeck;
}

const cru: { fonte: unknown; emoji: string; grupo: GrupoDeck }[] = [
  { fonte: populacaoMunicipios, emoji: "🏙️", grupo: "Brasil" },
  { fonte: areaEstados, emoji: "🗺️", grupo: "Brasil" },
  { fonte: paisesPopulacao, emoji: "🌎", grupo: "Mundo" },
  { fonte: paisesArea, emoji: "📐", grupo: "Mundo" },
  { fonte: paisesPib, emoji: "💰", grupo: "Mundo" },
  { fonte: animaisVelocidade, emoji: "🐆", grupo: "Diversão" },
  { fonte: filmesBilheteria, emoji: "🎬", grupo: "Diversão" },
  { fonte: montanhasAltura, emoji: "⛰️", grupo: "Diversão" },
  { fonte: prediosAltura, emoji: "🏢", grupo: "Diversão" },
  { fonte: planetasDiametro, emoji: "🪐", grupo: "Diversão" },
];

export const DECKS: DeckRegistrado[] = cru.map((c) => ({
  deck: parseDeck(c.fonte),
  emoji: c.emoji,
  grupo: c.grupo,
}));

/** O deck aberto por padrão (enquanto não há tela de seleção). */
export const deckPadrao: Deck = DECKS[0].deck;

export function acharDeck(id: string): Deck | undefined {
  return DECKS.find((d) => d.deck.id === id)?.deck;
}
