import { useMemo } from "react";
import bruto from "./lib/jogo/decks/ibge-populacao-municipios.json";
import { parseDeck } from "./lib/jogo";
import { useJogo } from "./hooks/useJogo";
import { useSom } from "./som/useSom";
import { Hud } from "./componentes/Hud";
import { Carta } from "./componentes/Carta";
import { NumeroAnimado } from "./componentes/NumeroAnimado";
import { BotoesPalpite } from "./componentes/BotoesPalpite";
import { FimDeJogo } from "./componentes/FimDeJogo";
import { BotaoSom } from "./componentes/BotaoSom";
import { inteiroBR } from "./util/formato";
import "./App.css";

export default function App() {
  const deck = useMemo(() => parseDeck(bruto), []);
  const {
    ancora,
    desafiante,
    pontos,
    recorde,
    fase,
    resultado,
    desfechoVisivel,
    recordeBatido,
    unidade,
    palpitar,
    concluirContagem,
    reiniciarJogo,
  } = useJogo(deck);
  const { mudo, alternar } = useSom();

  const estadoDesafiante =
    fase === "jogando"
      ? "oculto"
      : fase === "fim"
        ? "erro"
        : desfechoVisivel
          ? resultado?.acerto
            ? "acerto"
            : "erro"
          : "revelando";

  const treme = fase === "revelando" && desfechoVisivel && resultado?.acerto === false;
  const ancoraLimpa = ancora.nome.replace(/\s*\(.*?\)/g, "").trim();

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          Maior <em>ou</em> Menor?
        </div>
        <BotaoSom mudo={mudo} onAlternar={alternar} />
      </header>

      <Hud pontos={pontos} recorde={recorde} />

      <div className="kicker">{deck.titulo}</div>

      <main className={`palco ${treme ? "palco--treme" : ""}`}>
        <Carta item={ancora} papel="ancora" estado="ancora">
          <span className="tnum">{inteiroBR(ancora.valor)}</span>
          <span className="carta__unidade">{unidade}</span>
        </Carta>

        <div className="versus">
          <span>vs</span>
        </div>

        <Carta item={desafiante} papel="desafiante" estado={estadoDesafiante}>
          {fase === "jogando" ? (
            <span className="carta__interro">?</span>
          ) : fase === "fim" ? (
            <>
              <span className="tnum">{inteiroBR(desafiante.valor)}</span>
              <span className="carta__unidade">{unidade}</span>
            </>
          ) : (
            <>
              <NumeroAnimado
                key={`${pontos}-${desafiante.nome}`}
                valor={desafiante.valor}
                comSom
                onDone={concluirContagem}
                className="tnum"
              />
              <span className="carta__unidade">{unidade}</span>
            </>
          )}
        </Carta>
      </main>

      {fase === "jogando" ? (
        <div className="prompt-area">
          <p className="prompt">
            <strong>{desafiante.nome}</strong> tem mais ou menos que <strong>{ancoraLimpa}</strong>?
          </p>
          <BotoesPalpite onPalpite={palpitar} />
        </div>
      ) : (
        <p className="fonte">
          {deck.fonte} ·{" "}
          <a href={deck.fonte_url} target="_blank" rel="noreferrer">
            fonte
          </a>
        </p>
      )}

      {fase !== "jogando" && desfechoVisivel && resultado ? (
        <div className={`flash flash--${resultado.acerto ? "ok" : "erro"}`} aria-hidden="true" />
      ) : null}

      {fase === "fim" ? (
        <FimDeJogo pontos={pontos} recorde={recorde} recordeBatido={recordeBatido} onReiniciar={reiniciarJogo} />
      ) : null}
    </div>
  );
}
