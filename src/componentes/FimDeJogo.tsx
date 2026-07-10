interface Props {
  pontos: number;
  recorde: number;
  recordeBatido: boolean;
  onReiniciar: () => void;
}

export function FimDeJogo({ pontos, recorde, recordeBatido, onReiniciar }: Props) {
  return (
    <div className="fim" role="dialog" aria-modal="true" aria-label="Fim de jogo">
      <div className="fim__card">
        {recordeBatido ? <div className="fim__recorde">Novo recorde! 🎉</div> : null}
        <div className="fim__titulo">Fim!</div>
        <div className="fim__placar">
          <div className="fim__stat">
            <span className="fim__num tnum">{pontos}</span>
            <span className="fim__cap">acertos</span>
          </div>
          <div className="fim__stat">
            <span className="fim__num tnum">{recorde}</span>
            <span className="fim__cap">recorde</span>
          </div>
        </div>
        <button className="btn btn--jogar" onClick={onReiniciar}>
          Jogar de novo
        </button>
      </div>
    </div>
  );
}
