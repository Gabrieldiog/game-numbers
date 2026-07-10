import type { Deck } from "../lib/jogo";
import type { ModoPartida } from "../hooks/useJogo";
import { Icone } from "./Icones";

interface Props {
  deck: Deck;
  onEscolher: (modo: ModoPartida) => void;
  onVoltar: () => void;
}

const MODOS: { modo: ModoPartida; icone: string; nome: string; desc: string }[] = [
  { modo: "classico", icone: "alvo", nome: "Clássico", desc: "Um erro e acabou. Vai o quão longe conseguir." },
  { modo: "vidas", icone: "coracao", nome: "3 Vidas", desc: "Três chances. Erra três vezes e acaba." },
  { modo: "blitz", icone: "blitz", nome: "Blitz", desc: "Contra o relógio: 30s, e o combo multiplica os pontos." },
];

export function EscolhaModo({ deck, onEscolher, onVoltar }: Props) {
  return (
    <div className="app selecao">
      <header className="topo">
        <div className="marca">{deck.titulo}</div>
        <button className="som-btn" onClick={onVoltar} aria-label="Voltar" title="Voltar">
          ✕
        </button>
      </header>

      <p className="selecao__sub">Como você quer jogar?</p>

      <div className="modos">
        {MODOS.map((m) => (
          <button key={m.modo} className={`modo-card modo-card--${m.modo}`} onClick={() => onEscolher(m.modo)}>
            <span className="modo-card__icone">
              <Icone nome={m.icone} />
            </span>
            <span className="modo-card__txt">
              <strong>{m.nome}</strong>
              <span>{m.desc}</span>
            </span>
            <span className="modo-card__seta" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
