import { useEffect, useMemo, useRef, useState } from "react";
import { formatadorPara } from "../util/formato";
import { som } from "../som/audioEngine";

interface Props {
  valor: number;
  duracao?: number;
  comSom?: boolean;
  onDone?: () => void;
  className?: string;
}

const prefereReduzido = () =>
  typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Conta de 0 até `valor` com easing, tocando o tique do som em sincronia. */
export function NumeroAnimado({ valor, duracao = 1200, comSom = false, onDone, className }: Props) {
  const [display, setDisplay] = useState(0);
  const fmt = useMemo(() => formatadorPara(valor), [valor]);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (prefereReduzido()) {
      setDisplay(valor);
      onDoneRef.current?.();
      return;
    }
    let raf = 0;
    let inicio: number | null = null;
    let ultimoTique = 0;

    const passo = (t: number) => {
      if (inicio === null) inicio = t;
      const p = Math.min((t - inicio) / duracao, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(valor * eased);
      if (comSom && t - ultimoTique > 56 && p < 0.98) {
        ultimoTique = t;
        som.tique(p);
      }
      if (p < 1) raf = requestAnimationFrame(passo);
      else onDoneRef.current?.();
    };

    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [valor, duracao, comSom]);

  return <span className={className}>{fmt(display)}</span>;
}
