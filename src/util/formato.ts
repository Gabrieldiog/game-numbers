const nfFull = new Intl.NumberFormat("pt-BR");
const nfComp = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Inteiro com separador de milhar pt-BR: 11451245 -> "11.451.245". */
export function inteiroBR(n: number): string {
  return nfFull.format(Math.round(n));
}

/**
 * Devolve um formatador FIXO na escala do alvo. Números que cabem (< 1 bilhão)
 * saem com separador de milhar; de bilhão pra cima viram compacto ("1,46 bi",
 * "30,77 tri"). Fixar a escala no alvo evita o sufixo trocar (bi -> tri) no meio
 * da contagem animada.
 */
export function formatadorPara(alvo: number): (v: number) => string {
  const abs = Math.abs(alvo);
  if (abs < 1e9) return (v) => inteiroBR(v);
  const div = abs >= 1e12 ? 1e12 : 1e9;
  const suf = abs >= 1e12 ? "tri" : "bi";
  return (v) => `${nfComp.format(v / div)} ${suf}`;
}

/** Formata um valor único na sua melhor forma (exibição estática). */
export function formatar(v: number): string {
  return formatadorPara(v)(v);
}
