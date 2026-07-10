import { useMemo, useState } from "react";
import bruto from "./lib/jogo/decks/ibge-populacao-municipios.json";
import { itemAncora, itemDesafiante, jogar, novoJogo, parseDeck } from "./lib/jogo";
import type { EstadoJogo, Palpite } from "./lib/jogo";
import { inteiroBR } from "./util/formato";

// Harness mínimo do PR #1: só prova que o motor agnóstico + o deck + a validação
// de schema funcionam ponta a ponta. A tela de verdade (neon, som, reveal animado)
// entra no PR seguinte, reaproveitando este mesmo motor.

const caixa: React.CSSProperties = {
  padding: 16,
  border: "1px solid var(--linha)",
  borderRadius: 12,
  marginBottom: 12,
  textAlign: "center",
};

export default function App() {
  const deck = useMemo(() => parseDeck(bruto), []);
  const [estado, setEstado] = useState<EstadoJogo>(() => novoJogo(deck, { aoEsgotar: "reembaralhar" }));
  const ancora = itemAncora(estado);
  const desafiante = itemDesafiante(estado);

  const palpitar = (p: Palpite) => setEstado((e) => jogar(e, p));
  const reiniciar = () => setEstado(novoJogo(deck, { aoEsgotar: "reembaralhar", recorde: estado.recorde }));

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 20, color: "var(--nevoa)" }}>
      <h1 style={{ fontSize: 20 }}>Maior ou Menor?</h1>
      <p style={{ color: "var(--muted)" }}>{deck.titulo}</p>
      <p style={{ color: "var(--muted)" }}>
        Sequência: {estado.pontos} · Recorde: {estado.recorde}
      </p>

      {estado.fim ? (
        <div style={caixa}>
          <p>Fim! Você fez {estado.pontos} acertos.</p>
          {estado.ultima ? (
            <p style={{ color: "var(--muted)" }}>
              {desafiante.nome} tinha {inteiroBR(estado.ultima.valorDesafiante)} {deck.unidade}.
            </p>
          ) : null}
          <button onClick={reiniciar}>Jogar de novo</button>
        </div>
      ) : (
        <>
          <div style={caixa}>
            <strong>{ancora.nome}</strong>
            <div style={{ fontSize: 32 }}>{inteiroBR(ancora.valor)}</div>
            <small style={{ color: "var(--muted)" }}>{deck.unidade}</small>
          </div>
          <div style={caixa}>
            <strong>{desafiante.nome}</strong>
            <div style={{ fontSize: 32 }}>?</div>
          </div>
          <p style={{ textAlign: "center" }}>
            {desafiante.nome} tem mais ou menos que {ancora.nome}?
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => palpitar("maior")}>Maior</button>
            <button onClick={() => palpitar("menor")}>Menor</button>
          </div>
        </>
      )}

      <p style={{ marginTop: 20, fontSize: 12, color: "var(--muted)" }}>
        {deck.fonte} ·{" "}
        <a href={deck.fonte_url} target="_blank" rel="noreferrer">
          fonte
        </a>
      </p>
    </div>
  );
}
