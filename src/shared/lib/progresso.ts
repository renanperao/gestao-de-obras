/**
 * Cálculo de progresso ponderado — função pura, espelhada em SQL
 * (supabase/migrations/20260706000300_progresso.sql).
 *
 *   progresso_etapa = Σ(progresso_subetapa × peso) / Σ(peso)
 *   progresso_obra  = Σ(progresso_etapa × peso) / Σ(peso)
 */

export interface ItemPonderado {
  progresso: number
  peso: number
}

/** Limita um percentual ao intervalo 0–100. */
export function limitarPercentual(valor: number): number {
  return Math.min(100, Math.max(0, valor))
}

/**
 * Média ponderada dos progressos, arredondada a 2 casas (como no SQL).
 * Sem itens ou com soma de pesos ≤ 0, retorna 0.
 */
export function progressoPonderado(itens: ItemPonderado[]): number {
  const somaPesos = itens.reduce((soma, item) => soma + item.peso, 0)
  if (somaPesos <= 0) return 0

  const media =
    itens.reduce(
      (soma, item) => soma + limitarPercentual(item.progresso) * item.peso,
      0,
    ) / somaPesos

  return Math.round(limitarPercentual(media) * 100) / 100
}

export function calcularProgressoEtapa(
  subetapas: ItemPonderado[],
): number {
  return progressoPonderado(subetapas)
}

export function calcularProgressoObra(etapas: ItemPonderado[]): number {
  return progressoPonderado(etapas)
}
