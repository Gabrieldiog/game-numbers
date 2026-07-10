interface Props {
  pontos: number;
  recorde: number;
  rotulo?: string;
}

export function Hud({ pontos, recorde, rotulo = "Sequência" }: Props) {
  return (
    <div className="hud">
      <div className="hud__bloco">
        <span className="hud__label">{rotulo}</span>
        <span className="hud__valor tnum">{pontos}</span>
      </div>
      <div className="hud__bloco hud__bloco--dir">
        <span className="hud__label">Melhor</span>
        <span className="hud__valor tnum">{recorde}</span>
      </div>
    </div>
  );
}
