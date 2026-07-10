import type { Deck } from "../lib/jogo";
import { DECKS, type GrupoDeck } from "../lib/jogo/decks/registro";

interface Props {
  onEscolher: (deck: Deck) => void;
}

const GRUPOS: GrupoDeck[] = ["Brasil", "Mundo"];

export function Selecao({ onEscolher }: Props) {
  return (
    <div className="app selecao">
      <header className="topo">
        <div className="marca">
          Maior <em>ou</em> Menor?
        </div>
      </header>

      <p className="selecao__sub">Escolha uma categoria</p>

      {GRUPOS.map((grupo) => (
        <section key={grupo} className="selecao__grupo">
          <h2 className="selecao__grupo-titulo">{grupo}</h2>
          <div className="selecao__grid">
            {DECKS.filter((d) => d.grupo === grupo).map((d) => (
              <button key={d.deck.id} className="deck-card" onClick={() => onEscolher(d.deck)}>
                <span className="deck-card__emoji" aria-hidden="true">
                  {d.emoji}
                </span>
                <span className="deck-card__titulo">{d.deck.titulo}</span>
                <span className="deck-card__meta">
                  {d.deck.itens.length} itens · {d.deck.unidade}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}

      <p className="selecao__nota">Dado público, com a fonte citada em cada rodada.</p>
    </div>
  );
}
