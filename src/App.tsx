import { useState } from "react";
import type { Deck } from "./lib/jogo";
import { Selecao } from "./componentes/Selecao";
import { Jogo } from "./componentes/Jogo";
import "./App.css";

export default function App() {
  const [deck, setDeck] = useState<Deck | null>(null);

  if (!deck) return <Selecao onEscolher={setDeck} />;
  return <Jogo key={deck.id} deck={deck} onTrocar={() => setDeck(null)} />;
}
