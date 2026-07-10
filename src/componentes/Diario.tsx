import { useDesafioDiario } from "../hooks/useDesafioDiario";
import { useSom } from "../som/useSom";
import { Carta } from "./Carta";
import { NumeroAnimado } from "./NumeroAnimado";
import { BotoesPalpite } from "./BotoesPalpite";
import { BotaoSom } from "./BotaoSom";
import { ResultadoDiario } from "./ResultadoDiario";
import { formatar } from "../util/formato";

interface Props {
  onVoltar: () => void;
}

export function Diario({ onVoltar }: Props) {
  const d = useDesafioDiario();
  const { mudo, alternar } = useSom();

  if (d.fase === "fim" || !d.rodada) {
    return <ResultadoDiario iso={d.iso} respostas={d.respostas} jaJogou={d.jaJogou} onVoltar={onVoltar} />;
  }

  const r = d.rodada;
  const revelando = d.fase === "revelando";
  const estadoDesafiante = !revelando
    ? "oculto"
    : d.desfechoVisivel
      ? d.acertoAtual
        ? "acerto"
        : "erro"
      : "revelando";
  const treme = revelando && d.desfechoVisivel && d.acertoAtual === false;
  const ancoraLimpa = r.ancora.nome.replace(/\s*\(.*?\)/g, "").trim();

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">Desafio do dia</div>
        <div className="topo__acoes">
          <button className="som-btn" onClick={onVoltar} aria-label="Sair do desafio" title="Sair">
            ✕
          </button>
          <BotaoSom mudo={mudo} onAlternar={alternar} />
        </div>
      </header>

      <div className="progresso">
        <div className="progresso__barra">
          <span style={{ width: `${(d.indice / d.total) * 100}%` }} />
        </div>
        <span className="progresso__texto tnum">
          {d.indice + 1}/{d.total}
        </span>
      </div>

      <div className="kicker">{r.deckTitulo}</div>

      <main className={`palco ${treme ? "palco--treme" : ""}`}>
        <Carta item={r.ancora} papel="ancora" estado="ancora">
          <span className="tnum">{formatar(r.ancora.valor)}</span>
          <span className="carta__unidade">{r.unidade}</span>
        </Carta>

        <div className="versus">
          <span>vs</span>
        </div>

        <Carta item={r.desafiante} papel="desafiante" estado={estadoDesafiante}>
          {!revelando ? (
            <span className="carta__interro">?</span>
          ) : (
            <>
              <NumeroAnimado key={d.indice} valor={r.desafiante.valor} comSom onDone={d.concluirContagem} className="tnum" />
              <span className="carta__unidade">{r.unidade}</span>
            </>
          )}
        </Carta>
      </main>

      {d.fase === "jogando" ? (
        <div className="prompt-area">
          <p className="prompt">
            <strong>{r.desafiante.nome}</strong> tem mais ou menos que <strong>{ancoraLimpa}</strong>?
          </p>
          <BotoesPalpite onPalpite={d.palpitar} />
        </div>
      ) : (
        <p className="fonte">
          {r.fonte} ·{" "}
          <a href={r.fonteUrl} target="_blank" rel="noreferrer">
            fonte
          </a>
        </p>
      )}

      {revelando && d.desfechoVisivel ? (
        <div className={`flash flash--${d.acertoAtual ? "ok" : "erro"}`} aria-hidden="true" />
      ) : null}
    </div>
  );
}
