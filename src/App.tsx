import { useState } from "react";
import type { Deck } from "./lib/jogo";
import type { ModoPartida } from "./hooks/useJogo";
import { Selecao } from "./componentes/Selecao";
import { EscolhaModo } from "./componentes/EscolhaModo";
import { Jogo } from "./componentes/Jogo";
import { Diario } from "./componentes/Diario";
import { Multijogador } from "./componentes/Multijogador";
import "./App.css";

type Tela =
  | { t: "selecao" }
  | { t: "modo"; deck: Deck }
  | { t: "jogo"; deck: Deck; modo: ModoPartida }
  | { t: "diario" }
  | { t: "multi" };

export default function App() {
  const [tela, setTela] = useState<Tela>({ t: "selecao" });
  const selecao = () => setTela({ t: "selecao" });

  if (tela.t === "modo") {
    return (
      <EscolhaModo
        deck={tela.deck}
        onEscolher={(modo) => setTela({ t: "jogo", deck: tela.deck, modo })}
        onVoltar={selecao}
      />
    );
  }
  if (tela.t === "jogo") {
    return <Jogo key={`${tela.deck.id}:${tela.modo}`} deck={tela.deck} modo={tela.modo} onTrocar={selecao} />;
  }
  if (tela.t === "diario") {
    return <Diario onVoltar={selecao} />;
  }
  if (tela.t === "multi") {
    return <Multijogador onSair={selecao} />;
  }
  return (
    <Selecao
      onEscolher={(deck) => setTela({ t: "modo", deck })}
      onDiario={() => setTela({ t: "diario" })}
      onMultiplayer={() => setTela({ t: "multi" })}
    />
  );
}
