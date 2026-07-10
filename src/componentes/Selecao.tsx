import type { Deck } from "../lib/jogo";
import { DECKS, type GrupoDeck } from "../lib/jogo/decks/registro";

interface Props {
  onEscolher: (deck: Deck) => void;
  onDiario: () => void;
  onMultiplayer: () => void;
}

const GRUPOS: GrupoDeck[] = ["Brasil", "Mundo", "Diversão"];

export function Selecao({ onEscolher, onDiario, onMultiplayer }: Props) {
  return (
    <div className="app selecao">
      <header className="topo">
        <div className="marca">
          Maior <em>ou</em> Menor?
        </div>
      </header>

      <button className="diario-btn" onClick={onDiario}>
        <span className="diario-btn__emoji" aria-hidden="true">
          🗓️
        </span>
        <span className="diario-btn__txt">
          <strong>Desafio do dia</strong>
          <span>10 rodadas, iguais pra todo mundo hoje</span>
        </span>
        <span className="diario-btn__seta" aria-hidden="true">
          →
        </span>
      </button>

      <button className="diario-btn multi-btn" onClick={onMultiplayer}>
        <span className="diario-btn__emoji" aria-hidden="true">
          🌐
        </span>
        <span className="diario-btn__txt">
          <strong>Jogar 1 contra 1</strong>
          <span>desafie alguém em tempo real</span>
        </span>
        <span className="diario-btn__seta" aria-hidden="true">
          →
        </span>
      </button>

      <p className="selecao__sub">ou escolha uma categoria</p>

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
