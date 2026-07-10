// Ponto único de import: `import { novoJogo, jogar, validarDeck } from "@/lib/jogo"`.
export type {
  AoEsgotar,
  Deck,
  EstadoJogo,
  ItemDeck,
  ModoJogo,
  OpcoesJogo,
  Palpite,
  Resultado,
} from "./tipos";

export { avancar, comparar, itemAncora, itemDesafiante, jogar, novoJogo, proximoPar, reiniciar, sortearPar } from "./motor";

export {
  ITENS_RECOMENDADO,
  MIN_ITENS,
  parseDeck,
  validarDeck,
  type Validacao,
  type ValidacaoErro,
  type ValidacaoOk,
} from "./schema";
