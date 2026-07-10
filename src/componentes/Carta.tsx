import type { ReactNode } from "react";
import type { ItemDeck } from "../lib/jogo";

export type EstadoCarta = "ancora" | "oculto" | "revelando" | "acerto" | "erro";

interface Props {
  item: ItemDeck;
  papel: "ancora" | "desafiante";
  estado: EstadoCarta;
  logo?: boolean; // deck de logos: fundo branco + contain (não corta o logo)
  children?: ReactNode;
}

export function Carta({ item, papel, estado, logo, children }: Props) {
  const nomeLimpo = item.nome.replace(/\s*\(.*?\)/g, "").trim();
  const inicial = nomeLimpo.slice(0, 1).toLocaleUpperCase("pt-BR");
  const mostraFato = (estado === "acerto" || estado === "erro") && !!item.fato;
  const classeFoto = item.img ? `carta__medalhao--foto${logo ? " carta__medalhao--logo" : ""}` : "";

  return (
    <div className={`carta carta--${papel} carta--${estado}`}>
      <div className={`carta__medalhao ${classeFoto}`} aria-hidden="true">
        {item.img ? <img src={item.img} alt="" loading="lazy" /> : <span>{inicial}</span>}
      </div>
      <div className="carta__nome">{item.nome}</div>
      <div className="carta__numero">{children}</div>
      {mostraFato ? <div className="carta__fato">{item.fato}</div> : null}
    </div>
  );
}
