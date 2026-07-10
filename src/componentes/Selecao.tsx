import type { Deck } from "../lib/jogo";
import { DECKS, type GrupoDeck } from "../lib/jogo/decks/registro";
import { Icone, IconeDeck } from "./Icones";

interface Props {
  onEscolher: (deck: Deck) => void;
  onDiario: () => void;
  onMultiplayer: () => void;
}

const GRUPOS: GrupoDeck[] = ["Brasil", "Mundo", "Diversão"];
const SLUG: Record<GrupoDeck, string> = { Brasil: "brasil", Mundo: "mundo", Diversão: "diversao" };

export function Selecao({ onEscolher, onDiario, onMultiplayer }: Props) {
  return (
    <div className="app selecao">
      <header className="hero">
        <h1 className="hero__marca">
          Maior <em>ou</em> Menor?
        </h1>
        <p className="hero__tag">
          Duas coisas, um número escondido — você chuta qual é o maior. Um joguinho de portfólio com dado público
          real, só pra brincar um pouco.
        </p>
      </header>

      <div className="destaques">
        <button className="destaque destaque--diario" onClick={onDiario}>
          <span className="destaque__icone">
            <Icone nome="calendario" />
          </span>
          <span className="destaque__txt">
            <strong>Desafio do dia</strong>
            <span>10 rodadas, iguais pra todo mundo hoje</span>
          </span>
          <span className="destaque__seta" aria-hidden="true">
            →
          </span>
        </button>

        <button className="destaque destaque--multi" onClick={onMultiplayer}>
          <span className="destaque__icone">
            <Icone nome="versus" />
          </span>
          <span className="destaque__txt">
            <strong>Jogar 1 contra 1</strong>
            <span>desafie alguém em tempo real</span>
          </span>
          <span className="destaque__seta" aria-hidden="true">
            →
          </span>
        </button>
      </div>

      <p className="selecao__sub">ou escolha uma categoria</p>

      {GRUPOS.map((grupo) => (
        <section key={grupo} className={`grupo grupo--${SLUG[grupo]}`}>
          <h2 className="grupo__titulo">{grupo}</h2>
          <div className="grupo__grid">
            {DECKS.filter((d) => d.grupo === grupo).map((d) => (
              <button key={d.deck.id} className="deck-card" onClick={() => onEscolher(d.deck)}>
                <span className="deck-card__icone">
                  <IconeDeck id={d.deck.id} />
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

      <footer className="rodape">
        <p>Dado público, com a fonte citada em cada rodada.</p>
        <p className="rodape__nota">Projeto de portfólio — feito só pra brincar, não é produto.</p>
      </footer>
    </div>
  );
}
