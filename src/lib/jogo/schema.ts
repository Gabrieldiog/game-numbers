// Validação do baralho. O JSON de categoria é entrada não-confiável (pode vir
// torto, escrito à mão, gerado por outra ferramenta), então tratamos como tal:
// nada de confiar na forma. Sem dependência externa — é um validador honesto,
// à mão, que devolve erros (fatais) e avisos (o jogo roda, mas fica capenga).

import type { Deck, ItemDeck } from "./tipos";

/** Baralho válido: mínimo pra formar par e comparar. */
export const MIN_ITENS = 2;
/** Abaixo disto o jogo repete demais — vira aviso, não erro. */
export const ITENS_RECOMENDADO = 8;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface ValidacaoOk {
  ok: true;
  deck: Deck; // já com o tipo estreitado
  avisos: string[];
}
export interface ValidacaoErro {
  ok: false;
  erros: string[]; // impedem jogar
  avisos: string[];
}
export type Validacao = ValidacaoOk | ValidacaoErro;

function textoNaoVazio(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function numeroFinito(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function ehUrl(v: unknown): boolean {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validarItem(item: unknown, i: number, erros: string[]): item is ItemDeck {
  const onde = `itens[${i}]`;
  if (typeof item !== "object" || item === null) {
    erros.push(`${onde}: precisa ser um objeto`);
    return false;
  }
  const it = item as Record<string, unknown>;
  let ok = true;
  if (!textoNaoVazio(it.nome)) {
    erros.push(`${onde}.nome: string não-vazia obrigatória`);
    ok = false;
  }
  if (!numeroFinito(it.valor)) {
    erros.push(`${onde}.valor: número finito obrigatório (nada de NaN, Infinity ou string)`);
    ok = false;
  }
  if (it.img !== undefined && typeof it.img !== "string") {
    erros.push(`${onde}.img: se presente, precisa ser string`);
    ok = false;
  }
  if (it.fato !== undefined && typeof it.fato !== "string") {
    erros.push(`${onde}.fato: se presente, precisa ser string`);
    ok = false;
  }
  return ok;
}

/**
 * Valida um objeto qualquer (tipicamente JSON.parse de um arquivo de deck) e,
 * se passar, devolve o mesmo objeto tipado como Deck. Nunca lança.
 */
export function validarDeck(entrada: unknown): Validacao {
  const erros: string[] = [];
  const avisos: string[] = [];

  if (typeof entrada !== "object" || entrada === null || Array.isArray(entrada)) {
    return { ok: false, erros: ["deck: precisa ser um objeto JSON"], avisos };
  }
  const d = entrada as Record<string, unknown>;

  if (!textoNaoVazio(d.id)) erros.push("id: string não-vazia obrigatória");
  else if (!SLUG.test(d.id)) erros.push(`id: use um slug (minúsculas, dígitos e hífen), veio "${d.id}"`);

  for (const campo of ["titulo", "unidade", "pergunta", "fonte"] as const) {
    if (!textoNaoVazio(d[campo])) erros.push(`${campo}: string não-vazia obrigatória`);
  }
  if (!ehUrl(d.fonte_url)) erros.push("fonte_url: URL http(s) obrigatória (crédito da fonte)");
  if (d.descricao !== undefined && typeof d.descricao !== "string")
    erros.push("descricao: se presente, precisa ser string");
  if (d.atualizado_em !== undefined && typeof d.atualizado_em !== "string")
    erros.push("atualizado_em: se presente, precisa ser string ISO");

  if (!Array.isArray(d.itens)) {
    erros.push("itens: array obrigatório");
  } else {
    if (d.itens.length < MIN_ITENS) erros.push(`itens: pelo menos ${MIN_ITENS} pra formar par (veio ${d.itens.length})`);
    const nomes = new Set<string>();
    const valores: number[] = [];
    d.itens.forEach((item, i) => {
      if (validarItem(item, i, erros)) {
        const chave = item.nome.trim().toLocaleLowerCase("pt-BR");
        if (nomes.has(chave)) avisos.push(`itens[${i}].nome: "${item.nome}" está repetido`);
        nomes.add(chave);
        valores.push(item.valor);
      }
    });
    if (d.itens.length >= MIN_ITENS && d.itens.length < ITENS_RECOMENDADO)
      avisos.push(`baralho curto (${d.itens.length}); com < ${ITENS_RECOMENDADO} itens o jogo repete rápido`);
    if (new Set(valores).size < valores.length)
      avisos.push("há valores repetidos — vão dar empate (contam como acerto por padrão)");
  }

  if (erros.length > 0) return { ok: false, erros, avisos };
  return { ok: true, deck: entrada as Deck, avisos };
}

/** Açúcar: devolve o Deck ou lança com todos os erros juntos. */
export function parseDeck(entrada: unknown): Deck {
  const r = validarDeck(entrada);
  if (!r.ok) throw new Error(`deck inválido:\n- ${r.erros.join("\n- ")}`);
  return r.deck;
}
