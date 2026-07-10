import type { ReactNode } from "react";
import type { ItemDeck } from "../lib/jogo";

export type EstadoCarta = "ancora" | "oculto" | "revelando" | "acerto" | "erro";

interface Props {
  item: ItemDeck;
  papel: "ancora" | "desafiante";
  estado: EstadoCarta;
  children?: ReactNode;
}

export function Carta({ item, papel, estado, children }: Props) {
  const nomeLimpo = item.nome.replace(/\s*\(.*?\)/g, "").trim();
  const inicial = nomeLimpo.slice(0, 1).toLocaleUpperCase("pt-BR");
  const mostraFato = (estado === "acerto" || estado === "erro") && !!item.fato;

  return (
    <div className={`carta carta--${papel} carta--${estado}`}>
      <div className="carta__medalhao" aria-hidden="true">
        {item.img ? <img src={item.img} alt="" /> : <span>{inicial}</span>}
      </div>
      <div className="carta__nome">{item.nome}</div>
      <div className="carta__numero">{children}</div>
      {mostraFato ? <div className="carta__fato">{item.fato}</div> : null}
    </div>
  );
}
