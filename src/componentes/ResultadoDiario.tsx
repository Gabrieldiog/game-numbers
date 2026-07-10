import { useState } from "react";
import { textoCompartilhavel } from "../lib/jogo/diario";

interface Props {
  iso: string;
  respostas: boolean[];
  jaJogou: boolean;
  onVoltar: () => void;
}

export function ResultadoDiario({ iso, respostas, jaJogou, onVoltar }: Props) {
  const [copiado, setCopiado] = useState(false);
  const acertos = respostas.filter(Boolean).length;
  const total = respostas.length;
  const [ano, mes, dia] = iso.split("-");

  const compartilhar = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const texto = textoCompartilhavel(respostas, iso, url);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: texto });
        return;
      } catch {
        /* usuário cancelou: cai pro copiar */
      }
    }
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sem clipboard disponível */
    }
  };

  return (
    <div className="app diario-fim">
      <div className="resultado">
        <div className="resultado__kicker">
          Desafio de {dia}/{mes}/{ano}
        </div>
        {jaJogou ? <div className="resultado__nota">você já jogou hoje</div> : null}
        <div className="resultado__placar tnum">
          {acertos}
          <span>/{total}</span>
        </div>
        <div className="resultado__grade" aria-label={`${acertos} de ${total} acertos`}>
          {respostas.map((a, i) => (
            <span key={i} className={a ? "gq gq--ok" : "gq gq--erro"} aria-hidden="true" />
          ))}
        </div>
        <button className="btn btn--jogar" onClick={compartilhar}>
          {copiado ? "Copiado!" : "Compartilhar"}
        </button>
        <button className="resultado__voltar" onClick={onVoltar}>
          voltar
        </button>
      </div>
    </div>
  );
}
