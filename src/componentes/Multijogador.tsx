import { useState } from "react";
import { useMultiplayer, type MultiView } from "../hooks/useMultiplayer";
import { PartidaOnline } from "./PartidaOnline";

interface Props {
  onSair: () => void;
}

export function Multijogador({ onSair }: Props) {
  const mp = useMultiplayer();

  if (mp.fase === "nome") return <EntrarNome onProcurar={mp.procurar} onVoltar={onSair} />;
  if (mp.fase === "procurando" || mp.fase === "esperando")
    return <Procurando oponente={mp.fase === "esperando" ? mp.oponente : null} onCancelar={mp.cancelar} onVoltar={onSair} />;
  if (mp.fase === "saiu") return <OponenteSaiu onProcurarOutro={mp.procurarOutro} onVoltar={onSair} />;
  if (mp.fase === "fim") return <ResultadoOnline mp={mp} onVoltar={onSair} />;
  return <PartidaOnline mp={mp} onSair={onSair} />;
}

function Topo({ onVoltar }: { onVoltar: () => void }) {
  return (
    <header className="topo">
      <div className="marca">Multijogador</div>
      <button className="som-btn" onClick={onVoltar} aria-label="Voltar" title="Voltar">
        ✕
      </button>
    </header>
  );
}

function EntrarNome({ onProcurar, onVoltar }: { onProcurar: (n: string) => void; onVoltar: () => void }) {
  const [nome, setNome] = useState("");
  return (
    <div className="app multi-tela">
      <Topo onVoltar={onVoltar} />
      <div className="multi-centro">
        <div className="multi-emoji" aria-hidden="true">
          🌐
        </div>
        <h2 className="multi-titulo">Jogar 1 contra 1</h2>
        <p className="multi-sub">Coloque seu nome e procure um oponente. Vocês jogam as mesmas 10 rodadas.</p>
        <form
          className="multi-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (nome.trim()) onProcurar(nome);
          }}
        >
          <input
            className="multi-input"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            maxLength={20}
            autoFocus
          />
          <button className="btn btn--jogar" type="submit" disabled={!nome.trim()}>
            Procurar partida
          </button>
        </form>
      </div>
    </div>
  );
}

function Procurando({
  oponente,
  onCancelar,
  onVoltar,
}: {
  oponente: string | null;
  onCancelar: () => void;
  onVoltar: () => void;
}) {
  return (
    <div className="app multi-tela">
      <Topo onVoltar={onVoltar} />
      <div className="multi-centro">
        <div className="multi-spinner" aria-hidden="true" />
        <h2 className="multi-titulo">{oponente ? `Achou! vs ${oponente}` : "Procurando oponente…"}</h2>
        <p className="multi-sub">{oponente ? "Preparando a partida…" : "Segura aí, alguém já vem."}</p>
        {!oponente ? (
          <button className="resultado__voltar" onClick={onCancelar}>
            cancelar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function OponenteSaiu({ onProcurarOutro, onVoltar }: { onProcurarOutro: () => void; onVoltar: () => void }) {
  return (
    <div className="app multi-tela">
      <Topo onVoltar={onVoltar} />
      <div className="multi-centro">
        <div className="multi-emoji" aria-hidden="true">
          👋
        </div>
        <h2 className="multi-titulo">O oponente saiu</h2>
        <p className="multi-sub">A partida foi encerrada.</p>
        <button className="btn btn--jogar" onClick={onProcurarOutro}>
          Procurar outra pessoa
        </button>
        <button className="resultado__voltar" onClick={onVoltar}>
          voltar
        </button>
      </div>
    </div>
  );
}

function ResultadoOnline({ mp, onVoltar }: { mp: MultiView; onVoltar: () => void }) {
  const titulo = mp.resultado === "ganhou" ? "Você ganhou! 🎉" : mp.resultado === "perdeu" ? "Você perdeu" : "Empate!";
  return (
    <div className="app multi-tela">
      <div className="resultado">
        <div className="resultado__kicker">Fim da partida</div>
        <div className={`multi-resultado ${mp.resultado ? `multi-resultado--${mp.resultado}` : ""}`}>{titulo}</div>
        <div className="placar-final">
          <div className="placar-final__lado">
            <span className="placar-final__nome">Você</span>
            <span className="placar-final__pts tnum">{mp.meuScore}</span>
          </div>
          <span className="placar-final__x">×</span>
          <div className="placar-final__lado">
            <span className="placar-final__nome">{mp.oponente}</span>
            <span className="placar-final__pts tnum">{mp.oppScore}</span>
          </div>
        </div>
        {mp.aguardandoRematch ? (
          <p className="multi-sub">esperando o oponente aceitar…</p>
        ) : (
          <button className="btn btn--jogar" onClick={mp.rematch}>
            Jogar de novo
          </button>
        )}
        <button className="resultado__voltar" onClick={mp.procurarOutro}>
          procurar outra pessoa
        </button>
        <button className="resultado__voltar" onClick={onVoltar}>
          sair
        </button>
      </div>
    </div>
  );
}
