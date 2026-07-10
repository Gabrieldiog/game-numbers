import type { MultiView } from "../hooks/useMultiplayer";
import { useSom } from "../som/useSom";
import { Carta } from "./Carta";
import { NumeroAnimado } from "./NumeroAnimado";
import { BotoesPalpite } from "./BotoesPalpite";
import { BotaoSom } from "./BotaoSom";
import { formatar } from "../util/formato";

interface Props {
  mp: MultiView;
  onSair: () => void;
}

export function PartidaOnline({ mp, onSair }: Props) {
  const { mudo, alternar } = useSom();
  const r = mp.rodada;

  if (!r) {
    return (
      <div className="app multi-tela">
        <div className="multi-centro">
          <div className="multi-spinner" aria-hidden="true" />
          <p className="multi-sub">preparando a partida…</p>
        </div>
      </div>
    );
  }

  const revelando = mp.fase === "revelando";
  const estadoDesafiante = !revelando
    ? "oculto"
    : mp.desfechoVisivel
      ? mp.revelacao?.acerto
        ? "acerto"
        : "erro"
      : "revelando";
  const treme = revelando && mp.desfechoVisivel && mp.revelacao?.acerto === false;
  const ancoraLimpa = r.ancora.nome.replace(/\s*\(.*?\)/g, "").trim();

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">Multijogador</div>
        <div className="topo__acoes">
          <button className="som-btn" onClick={onSair} aria-label="Sair da partida" title="Sair">
            ✕
          </button>
          <BotaoSom mudo={mudo} onAlternar={alternar} />
        </div>
      </header>

      <div className="placar-vs">
        <div className="placar-vs__lado">
          <span className="placar-vs__nome">Você</span>
          <span className="placar-vs__pts tnum">{mp.meuScore}</span>
        </div>
        <div className="placar-vs__x">vs</div>
        <div className="placar-vs__lado placar-vs__lado--dir">
          <span className="placar-vs__nome">{mp.oponente}</span>
          <span className="placar-vs__pts tnum">{mp.oppScore}</span>
        </div>
      </div>

      <div className="progresso">
        <div className="progresso__barra">
          <span style={{ width: `${(r.indice / mp.total) * 100}%` }} />
        </div>
        <span className="progresso__texto tnum">
          {r.indice + 1}/{mp.total}
        </span>
      </div>

      <div className="kicker">{r.deckTitulo}</div>

      <main className={`palco ${treme ? "palco--treme" : ""}`}>
        <Carta item={{ nome: r.ancora.nome, valor: r.ancora.valor }} papel="ancora" estado="ancora">
          <span className="tnum">{formatar(r.ancora.valor)}</span>
          <span className="carta__unidade">{r.unidade}</span>
        </Carta>

        <div className="versus">
          <span>vs</span>
        </div>

        <Carta item={{ nome: r.desafiante.nome, valor: 0 }} papel="desafiante" estado={estadoDesafiante}>
          {!revelando ? (
            <span className="carta__interro">?</span>
          ) : (
            <>
              <NumeroAnimado
                key={r.indice}
                valor={mp.revelacao?.valor ?? 0}
                comSom
                onDone={mp.concluirContagem}
                className="tnum"
              />
              <span className="carta__unidade">{r.unidade}</span>
            </>
          )}
        </Carta>
      </main>

      {mp.fase === "jogando" ? (
        <div className="prompt-area">
          <p className="prompt">
            <strong>{r.desafiante.nome}</strong> tem mais ou menos que <strong>{ancoraLimpa}</strong>?
          </p>
          <BotoesPalpite onPalpite={mp.palpitar} />
        </div>
      ) : (
        <p className="fonte">
          {r.fonte} ·{" "}
          <a href={r.fonteUrl} target="_blank" rel="noreferrer">
            fonte
          </a>
        </p>
      )}

      {revelando && mp.desfechoVisivel && mp.revelacao ? (
        <div className={`flash flash--${mp.revelacao.acerto ? "ok" : "erro"}`} aria-hidden="true" />
      ) : null}
    </div>
  );
}
