interface Props {
  mudo: boolean;
  onAlternar: () => void;
}

export function BotaoSom({ mudo, onAlternar }: Props) {
  return (
    <button
      className="som-btn"
      onClick={onAlternar}
      aria-label={mudo ? "Ativar som" : "Desativar som"}
      title={mudo ? "Som desligado" : "Som ligado"}
    >
      {mudo ? "🔇" : "🔊"}
    </button>
  );
}
