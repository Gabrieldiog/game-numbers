import type { Palpite } from "../lib/jogo";

interface Props {
  onPalpite: (p: Palpite) => void;
  desabilitado?: boolean;
}

export function BotoesPalpite({ onPalpite, desabilitado }: Props) {
  return (
    <div className="palpite">
      <button
        className="btn btn--maior"
        onClick={() => onPalpite("maior")}
        disabled={desabilitado}
        aria-label="Maior"
      >
        <span className="btn__seta" aria-hidden="true">▲</span> Maior
      </button>
      <button
        className="btn btn--menor"
        onClick={() => onPalpite("menor")}
        disabled={desabilitado}
        aria-label="Menor"
      >
        <span className="btn__seta" aria-hidden="true">▼</span> Menor
      </button>
    </div>
  );
}
