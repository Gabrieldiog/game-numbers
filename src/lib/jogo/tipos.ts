// O jogo "Maior ou Menor": mostra uma coisa com um número, você chuta se a
// próxima tem valor MAIOR ou MENOR, acertou continua. Toda a lógica é agnóstica
// ao dataset — quem define uma categoria é um baralho (Deck), que é só um JSON.
// Adicionar categoria nova = escrever 1 arquivo destes, sem tocar no motor.

/** Uma carta: uma coisa com um número comparável. img/fato são só pra view. */
export interface ItemDeck {
  nome: string;
  valor: number;
  img?: string; // url ou caminho; a view revela junto com o valor
  fato?: string; // curiosidade mostrada no reveal ("2ª cidade mais populosa")
}

/** Um baralho = uma categoria. É o único arquivo que se escreve pra crescer. */
export interface Deck {
  id: string; // slug único: "ibge-populacao-municipios"
  titulo: string; // "População dos municípios"
  unidade: string; // "habitantes", "km²", "R$"
  pergunta: string; // "Tem MAIS ou MENOS habitantes?"
  fonte: string; // "IBGE — Censo 2022"
  fonte_url: string; // link pra fonte (crédito honesto)
  descricao?: string; // subtítulo opcional
  atualizado_em?: string; // ISO date opcional (quando o dado foi puxado)
  imagem?: "foto" | "logo"; // "logo" = imagem com fundo transparente (marcas): a
  // carta usa fundo branco + object-fit contain, pra o logo caber inteiro. Default "foto".
  itens: ItemDeck[]; // >= 2, senão não dá pra formar par
}

/** O chute do jogador na rodada: o desafiante é MAIOR ou MENOR que a âncora. */
export type Palpite = "maior" | "menor";

/**
 * Como a partida corre:
 *  - "livre": a cada rodada o jogador escolhe maior ou menor (clássico).
 *  - "maior": só existe o botão "maior" — variante de direção fixa.
 *  - "menor": só existe o botão "menor".
 * É isto que dá suporte a "modo maior" e "modo menor".
 */
export type ModoJogo = "livre" | "maior" | "menor";

/** Quando o baralho acaba (todo item já apareceu): recomeça ou encerra. */
export type AoEsgotar = "reembaralhar" | "encerrar";

export interface OpcoesJogo {
  modo?: ModoJogo; // default "livre"
  empateEhAcerto?: boolean; // valores iguais contam como acerto? default true
  aoEsgotar?: AoEsgotar; // default "reembaralhar" (jogo sem fim natural)
  semente?: number; // fixa o PRNG → partida reproduzível; default aleatório
  recorde?: number; // melhor pontuação prévia, só pra carregar de fora
}

/** O que aconteceu num palpite. A view usa isto pra animar o reveal. */
export interface Resultado {
  acerto: boolean;
  palpite: Palpite; // o palpite de fato avaliado (já resolvido pelo modo)
  realidade: Palpite | "empate"; // o que o número dizia
  valorAncora: number;
  valorDesafiante: number;
  diferenca: number; // desafiante - ancora
}

/**
 * Estado imutável de uma partida. Tudo que o motor precisa está aqui, inclusive
 * a semente do PRNG — então uma partida é 100% reproduzível e serializável
 * (dá pra salvar no localStorage e retomar, ou refazer o replay num teste).
 */
export interface EstadoJogo {
  readonly deck: Deck;
  readonly modo: ModoJogo;
  readonly empateEhAcerto: boolean;
  readonly aoEsgotar: AoEsgotar;
  readonly ancora: number; // índice do item revelado (o "primeiro")
  readonly desafiante: number; // índice do item a adivinhar (o "segundo")
  readonly usados: readonly number[]; // índices já mostrados nesta passada do baralho
  readonly pontos: number; // acertos seguidos
  readonly rodadas: number; // palpites dados
  readonly recorde: number; // melhor pontuação vista
  readonly fim: boolean; // true quando errou (ou zerou o baralho com "encerrar")
  readonly vitoria: boolean; // true só quando zerou o baralho inteiro
  readonly ultima: Resultado | null; // resultado do último palpite (pro reveal)
  readonly semente: number; // estado atual do PRNG
}
