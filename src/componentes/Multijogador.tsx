import { useEffect, useState } from "react";
import { useMultiplayer, type MultiView } from "../hooks/useMultiplayer";
import { PartidaOnline } from "./PartidaOnline";

interface Props {
  onSair: () => void;
}

export function Multijogador({ onSair }: Props) {
  const mp = useMultiplayer();

  if (mp.fase === "nome") return <EntrarNome onProcurar={mp.procurar} onVoltar={onSair} />;
  if (mp.fase === "acordando") return <Acordando onCancelar={mp.cancelar} onVoltar={onSair} />;
  if (mp.fase === "procurando" || mp.fase === "esperando")
    return <Procurando oponente={mp.fase === "esperando" ? mp.oponente : null} onCancelar={mp.cancelar} onVoltar={onSair} />;
  if (mp.fase === "cochilou") return <Cochilou onTentar={mp.procurarOutro} onVoltar={onSair} />;
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

// O modo online usa o Balcão (um gateway de portfólio) como backend, hospedado
// no plano grátis do Render — que dorme quando ninguém usa e demora uns segundos
// pra acordar. Em vez de esconder isso, a gente faz piada com a espera.
const FRASES_ACORDANDO = [
  "É projeto de portfólio: tudo aqui é de graça, inclusive a preguiça. 😴",
  "O servidor grátis tava dormindo — ninguém paga hora extra pra ele.",
  "Cutucando o coitado… free tier não tem plantão 24h.",
  "Custo do projeto: R$ 0,00. Pressa: também. kkk",
  "Já vai! Ele acorda devagar igual segunda-feira.",
  "Servidor de graça esfregando os olhos… paciência que já levanta.",
];

function Acordando({ onCancelar, onVoltar }: { onCancelar: () => void; onVoltar: () => void }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % FRASES_ACORDANDO.length), 2600);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="app multi-tela">
      <Topo onVoltar={onVoltar} />
      <div className="multi-centro">
        <div className="multi-spinner" aria-hidden="true" />
        <h2 className="multi-titulo">Acordando o servidor…</h2>
        <p className="multi-sub multi-sub--gira" key={i}>
          {FRASES_ACORDANDO[i]}
        </p>
        <button className="resultado__voltar" onClick={onCancelar}>
          cancelar
        </button>
      </div>
    </div>
  );
}

function Cochilou({ onTentar, onVoltar }: { onTentar: () => void; onVoltar: () => void }) {
  return (
    <div className="app multi-tela">
      <Topo onVoltar={onVoltar} />
      <div className="multi-centro">
        <div className="multi-emoji" aria-hidden="true">
          😴
        </div>
        <h2 className="multi-titulo">O servidor cochilou de novo</h2>
        <p className="multi-sub">Free tier é assim mesmo — cutuca de novo que ele levanta.</p>
        <button className="btn btn--jogar" onClick={onTentar}>
          Cutucar de novo
        </button>
        <button className="resultado__voltar" onClick={onVoltar}>
          voltar
        </button>
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
