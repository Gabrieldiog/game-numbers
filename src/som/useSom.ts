import { useCallback, useState } from "react";
import { som } from "./audioEngine";

/** Espelha o estado de mute do motor de som pra UI reagir. */
export function useSom() {
  const [mudo, setMudo] = useState(som.mudo);
  const alternar = useCallback(() => setMudo(som.alternarMudo()), []);
  const destravar = useCallback(() => som.destravar(), []);
  return { mudo, alternar, destravar, som };
}
