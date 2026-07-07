import type { ConfiguracaoEscritorio } from '@/shared/types/database'

/**
 * Aplica a identidade do escritório (cores, nome) via CSS variables —
 * vale para o painel e para o portal do cliente.
 */
export function aplicarBranding(config: ConfiguracaoEscritorio): void {
  const raiz = document.documentElement
  if (config.cor_primaria) {
    raiz.style.setProperty('--cor-primaria', config.cor_primaria)
  }
  if (config.cor_destaque) {
    raiz.style.setProperty('--cor-destaque', config.cor_destaque)
  }
  if (config.nome_escritorio) {
    document.title = config.nome_escritorio
  }
}
