const nf = new Intl.NumberFormat("pt-BR");

/** Inteiro com separador de milhar pt-BR: 11451245 -> "11.451.245". */
export function inteiroBR(n: number): string {
  return nf.format(Math.round(n));
}
