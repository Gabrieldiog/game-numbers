// O desafio diário: uma sequência de rodadas determinística pela DATA, pra todo
// mundo jogar exatamente a mesma coisa no mesmo dia (estilo Wordle). Puro e sem
// estado global — a data entra como parâmetro, então dá pra reproduzir e testar.
// Cada rodada sorteia um deck e um par distinto dele (mistura as categorias).

import type { Deck, ItemDeck } from "./tipos";

export interface RodadaDiaria {
  deckId: string;
  deckTitulo: string;
  unidade: string;
  pergunta: string;
  fonte: string;
  fonteUrl: string;
  logo: boolean; // o deck é de logos (fundo branco + contain na carta)?
  ancora: ItemDeck;
  desafiante: ItemDeck;
}

export const TOTAL_DIARIO = 10;

// PRNG determinístico (mulberry32) a partir de uma semente.
function prng(semente: number): () => number {
  let s = semente >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Semente estável a partir da string da data (hash FNV-1a). */
export function sementeDaData(iso: string): number {
  let h = 2166136261;
  for (let i = 0; i < iso.length; i++) {
    h ^= iso.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Data local no formato AAAA-MM-DD (sem depender de fuso/UTC). */
export function dataLocalISO(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/**
 * Monta o desafio do dia: `total` rodadas determinísticas pela data. Cada rodada
 * sorteia um deck e um par distinto dele. Evita empate e "quase empate" (< 1% de
 * diferença) re-sorteando, pra nenhuma rodada virar cara-ou-coroa injusto.
 */
export function montarDesafioDiario(decks: Deck[], iso: string, total: number = TOTAL_DIARIO): RodadaDiaria[] {
  const rnd = prng(sementeDaData(iso));
  const jogaveis = decks.filter((d) => d.itens.length >= 2);
  if (jogaveis.length === 0) return [];

  const rodadas: RodadaDiaria[] = [];
  let guarda = 0;
  while (rodadas.length < total && guarda < total * 40) {
    guarda++;
    const deck = jogaveis[Math.floor(rnd() * jogaveis.length)];
    const itens = deck.itens;
    const a = Math.floor(rnd() * itens.length);
    let b = Math.floor(rnd() * itens.length);
    if (b === a) b = (b + 1) % itens.length;

    const ancora = itens[a];
    const desafiante = itens[b];
    const maior = Math.max(ancora.valor, desafiante.valor);
    const menor = Math.min(ancora.valor, desafiante.valor);
    if (maior === menor) continue; // empate
    if (menor > 0 && (maior - menor) / maior < 0.01) continue; // quase empate: injusto

    rodadas.push({
      deckId: deck.id,
      deckTitulo: deck.titulo,
      unidade: deck.unidade,
      pergunta: deck.pergunta,
      fonte: deck.fonte,
      fonteUrl: deck.fonte_url,
      logo: deck.imagem === "logo",
      ancora,
      desafiante,
    });
  }
  return rodadas;
}

/** Texto compartilhável estilo Wordle: grade de emojis + placar (+ link opcional). */
export function textoCompartilhavel(acertos: boolean[], iso: string, url?: string): string {
  const [ano, mes, dia] = iso.split("-");
  const grade = acertos.map((a) => (a ? "🟩" : "🟥")).join("");
  const placar = acertos.filter(Boolean).length;
  const linhas = [`Maior ou Menor? — Desafio de ${dia}/${mes}/${ano}`, grade, `Fiz ${placar}/${acertos.length}`];
  if (url) linhas.push(url);
  return linhas.join("\n");
}
