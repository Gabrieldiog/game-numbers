// O motor. Puro e agnóstico ao dataset: recebe um Deck (já validado) e devolve
// estados imutáveis. Nenhuma leitura de rede, nenhum Math.random escondido — a
// aleatoriedade mora na semente guardada no estado, então toda partida é
// reproduzível (bom pra teste e pra "replay"). A view só lê EstadoJogo e chama
// jogar(); nada de regra do jogo vive no React.

import type { AoEsgotar, Deck, EstadoJogo, ItemDeck, ModoJogo, OpcoesJogo, Palpite, Resultado } from "./tipos";

const VAZIO: ReadonlySet<number> = new Set();

// PRNG determinístico (mulberry32). Recebe uma semente e devolve o próximo par
// (nova semente, valor em [0,1)). Sem estado global.
function passo(semente: number): { semente: number; r: number } {
  let t = (semente + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { semente: t >>> 0, r };
}

// Sorteia um índice em [0,total) que não esteja em `excluir`. Devolve null se
// não sobrou candidato (baralho esgotado).
function sortearIndice(
  total: number,
  excluir: ReadonlySet<number>,
  semente: number,
): { indice: number; semente: number } | null {
  const candidatos: number[] = [];
  for (let i = 0; i < total; i++) if (!excluir.has(i)) candidatos.push(i);
  if (candidatos.length === 0) return null;
  const { semente: s2, r } = passo(semente);
  return { indice: candidatos[Math.floor(r * candidatos.length)], semente: s2 };
}

/** Sorteia um par distinto (âncora + desafiante). Assume deck com >= 2 itens. */
export function sortearPar(
  deck: Deck,
  semente: number,
): { ancora: number; desafiante: number; semente: number } {
  const total = deck.itens.length;
  const a = sortearIndice(total, VAZIO, semente)!;
  const b = sortearIndice(total, new Set([a.indice]), a.semente)!;
  return { ancora: a.indice, desafiante: b.indice, semente: b.semente };
}

/**
 * Compara o desafiante com a âncora sob um palpite. Função pura, não mexe no
 * estado — é o "comparar maior/menor" isolado, fácil de testar.
 */
export function comparar(estado: EstadoJogo, palpite: Palpite): Resultado {
  const va = estado.deck.itens[estado.ancora].valor;
  const vd = estado.deck.itens[estado.desafiante].valor;
  const realidade: Palpite | "empate" = vd > va ? "maior" : vd < va ? "menor" : "empate";
  const acerto = realidade === "empate" ? estado.empateEhAcerto : realidade === palpite;
  return { acerto, palpite, realidade, valorAncora: va, valorDesafiante: vd, diferenca: vd - va };
}

/**
 * Avança a partida depois de um acerto: o segundo (desafiante) vira o novo
 * primeiro (âncora) e sorteia-se um novo desafiante entre os que ainda não
 * saíram. Se o baralho esgotou, reembaralha (mantendo a âncora) ou encerra em
 * vitória, conforme a opção. Assume que `resultado.acerto` é true.
 */
export function avancar(estado: EstadoJogo, resultado: Resultado): EstadoJogo {
  const total = estado.deck.itens.length;
  const novaAncora = estado.desafiante; // o segundo vira o novo primeiro
  const pontos = estado.pontos + 1;
  const rodadas = estado.rodadas + 1;
  const recorde = Math.max(estado.recorde, pontos);

  const usados = new Set(estado.usados);
  usados.add(novaAncora);

  let proximo = sortearIndice(total, usados, estado.semente);

  if (!proximo) {
    // esgotou: todo item já apareceu nesta passada
    if (estado.aoEsgotar === "encerrar") {
      return {
        ...estado,
        ancora: novaAncora,
        usados: [...usados],
        pontos,
        rodadas,
        recorde,
        fim: true,
        vitoria: true,
        ultima: resultado,
      };
    }
    // reembaralha: recomeça a passada mantendo só a âncora atual
    usados.clear();
    usados.add(novaAncora);
    proximo = sortearIndice(total, usados, estado.semente)!;
  }

  usados.add(proximo.indice);
  return {
    ...estado,
    ancora: novaAncora,
    desafiante: proximo.indice,
    usados: [...usados],
    pontos,
    rodadas,
    recorde,
    fim: false,
    vitoria: false,
    ultima: resultado,
    semente: proximo.semente,
  };
}

/** Começa uma partida: aplica defaults, semeia o PRNG e sorteia o primeiro par. */
export function novoJogo(deck: Deck, opcoes: OpcoesJogo = {}): EstadoJogo {
  if (deck.itens.length < 2) throw new Error("deck precisa de ao menos 2 itens pra jogar");
  const modo: ModoJogo = opcoes.modo ?? "livre";
  const aoEsgotar: AoEsgotar = opcoes.aoEsgotar ?? "reembaralhar";
  const empateEhAcerto = opcoes.empateEhAcerto ?? true;
  const semente0 = (opcoes.semente ?? Math.floor(Math.random() * 0x100000000)) >>> 0;
  const par = sortearPar(deck, semente0);
  return {
    deck,
    modo,
    empateEhAcerto,
    aoEsgotar,
    ancora: par.ancora,
    desafiante: par.desafiante,
    usados: [par.ancora, par.desafiante],
    pontos: 0,
    rodadas: 0,
    recorde: opcoes.recorde ?? 0,
    fim: false,
    vitoria: false,
    ultima: null,
    semente: par.semente,
  };
}

/**
 * A jogada que a view chama. Resolve o palpite pelo modo (em modo fixo, o modo
 * manda), compara e: acertou → avança; errou → encerra a partida. Se a partida
 * já acabou, é no-op (devolve o mesmo estado) — seguro contra clique duplo.
 */
export function jogar(estado: EstadoJogo, palpite: Palpite): EstadoJogo {
  if (estado.fim) return estado;
  const efetivo: Palpite = estado.modo === "livre" ? palpite : estado.modo;
  const resultado = comparar(estado, efetivo);
  if (!resultado.acerto) {
    return { ...estado, rodadas: estado.rodadas + 1, fim: true, vitoria: false, ultima: resultado };
  }
  return avancar(estado, resultado);
}

/** Recomeça do zero mantendo deck e opções; leva o recorde adiante. */
export function reiniciar(estado: EstadoJogo, semente?: number): EstadoJogo {
  const opcoes: OpcoesJogo = {
    modo: estado.modo,
    empateEhAcerto: estado.empateEhAcerto,
    aoEsgotar: estado.aoEsgotar,
    recorde: estado.recorde,
  };
  if (semente !== undefined) opcoes.semente = semente;
  return novoJogo(estado.deck, opcoes);
}

// atalhos pra view não indexar o deck na mão
export const itemAncora = (e: EstadoJogo): ItemDeck => e.deck.itens[e.ancora];
export const itemDesafiante = (e: EstadoJogo): ItemDeck => e.deck.itens[e.desafiante];
