import type { Deck } from "../lib/jogo";
import { useJogo, type ModoPartida, TEMPO_BLITZ } from "../hooks/useJogo";
import { useSom } from "../som/useSom";
import { Hud } from "./Hud";
import { Carta } from "./Carta";
import { NumeroAnimado } from "./NumeroAnimado";
import { BotoesPalpite } from "./BotoesPalpite";
import { FimDeJogo } from "./FimDeJogo";
import { BotaoSom } from "./BotaoSom";
import { formatar } from "../util/formato";

interface Props {
  deck: Deck;
  modo: ModoPartida;
  onTrocar: () => void;
}

export function Jogo({ deck, modo, onTrocar }: Props) {
  const {
    ancora,
    desafiante,
    pontos,
    recorde,
    vidas,
    tempo,
    combo,
    fase,
    resultado,
    desfechoVisivel,
    recordeBatido,
    unidade,
    palpitar,
    concluirContagem,
    reiniciarJogo,
  } = useJogo(deck, modo);
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
  const duracaoReveal = modo === "blitz" ? 600 : 1200;

  return (
    <div className="app">
      <header className="topo">
        <div className="marca">
          Maior <em>ou</em> Menor?
        </div>
        <div className="topo__acoes">
          <button className="som-btn" onClick={onTrocar} aria-label="Trocar categoria" title="Trocar categoria">
            🔀
          </button>
          <BotaoSom mudo={mudo} onAlternar={alternar} />
        </div>
      </header>

      <Hud pontos={pontos} recorde={recorde} rotulo={modo === "blitz" ? "Pontos" : "Sequência"} />

      {modo === "vidas" ? (
        <div className="vidas" aria-label={`${vidas} de 3 vidas`}>
          {[1, 2, 3].map((i) => (
            <span key={i} className={`vida ${i <= vidas ? "vida--cheia" : ""}`} aria-hidden="true">
              ♥
            </span>
          ))}
        </div>
      ) : null}

      {modo === "blitz" ? (
        <div className="blitz-hud">
          <div className={`blitz-barra ${tempo <= 8 ? "blitz-barra--urgente" : ""}`}>
            <div className="blitz-barra__trilho">
              <span style={{ width: `${(tempo / TEMPO_BLITZ) * 100}%` }} />
            </div>
            <span className="blitz-barra__tempo tnum">{tempo}s</span>
          </div>
          {combo > 1 ? <span className="blitz-combo">combo ×{combo}</span> : null}
        </div>
      ) : null}

      <div className="kicker">{deck.titulo}</div>

      <main className={`palco ${treme ? "palco--treme" : ""}`}>
        <Carta item={ancora} papel="ancora" estado="ancora" logo={deck.imagem === "logo"}>
          <span className="tnum">{formatar(ancora.valor)}</span>
          <span className="carta__unidade">{unidade}</span>
        </Carta>

        <div className="versus">
          <span>vs</span>
        </div>

        <Carta item={desafiante} papel="desafiante" estado={estadoDesafiante} logo={deck.imagem === "logo"}>
          {fase === "jogando" ? (
            <span className="carta__interro">?</span>
          ) : fase === "fim" ? (
            <>
              <span className="tnum">{formatar(desafiante.valor)}</span>
              <span className="carta__unidade">{unidade}</span>
            </>
          ) : (
            <>
              <NumeroAnimado
                key={`${pontos}-${desafiante.nome}`}
                valor={desafiante.valor}
                duracao={duracaoReveal}
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
