import { useState } from "react";
import type { Deck } from "./lib/jogo";
import { Selecao } from "./componentes/Selecao";
import { Jogo } from "./componentes/Jogo";
import { Diario } from "./componentes/Diario";
import "./App.css";

type Tela = { t: "selecao" } | { t: "jogo"; deck: Deck } | { t: "diario" };

export default function App() {
  const [tela, setTela] = useState<Tela>({ t: "selecao" });
  const voltarPraSelecao = () => setTela({ t: "selecao" });

  if (tela.t === "jogo") return <Jogo key={tela.deck.id} deck={tela.deck} onTrocar={voltarPraSelecao} />;
  if (tela.t === "diario") return <Diario onVoltar={voltarPraSelecao} />;
  return <Selecao onEscolher={(deck) => setTela({ t: "jogo", deck })} onDiario={() => setTela({ t: "diario" })} />;
}
