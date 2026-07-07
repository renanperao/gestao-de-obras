import type {
  Etapa,
  EtapaTemplate,
  Pavimento,
  Subetapa,
  SubetapaTemplate,
} from '@/shared/types/database'

export interface TemplateComSubetapas {
  etapa: EtapaTemplate
  subetapas: SubetapaTemplate[]
}

export interface TemplateSelecionado {
  templateId: string
  nome: string
  peso: number
  ordem: number
  subetapas: Array<{
    templateId: string
    nome: string
    peso: number
    ordem: number
  }>
}

export interface EtapaComSubetapas extends Etapa {
  subetapas: Subetapa[]
}

export interface PavimentoComEtapas extends Pavimento {
  etapas: EtapaComSubetapas[]
}

export interface EstruturaAgrupada {
  pavimentos: PavimentoComEtapas[]
  etapasGerais: EtapaComSubetapas[]
}

export interface ResumoEstrutura {
  totalEtapas: number
  totalSubetapas: number
  subetapasConcluidas: number
}

function ordenarPorOrdemNome<T extends { ordem: number; nome: string }>(
  itens: T[],
): T[] {
  return [...itens].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome))
}

export function criarNomesPavimentos(quantidade: number): string[] {
  const total = Math.max(1, Math.min(20, Math.floor(quantidade)))

  if (total === 1) return ['Térreo']
  if (total === 2) return ['Térreo', 'Superior']

  return Array.from({ length: total }, (_, indice) => {
    if (indice === 0) return 'Térreo'
    return `${indice}º Pavimento`
  })
}

export function agruparTemplates(
  etapas: EtapaTemplate[],
  subetapas: SubetapaTemplate[],
): TemplateComSubetapas[] {
  const subetapasPorEtapa = new Map<string, SubetapaTemplate[]>()

  for (const subetapa of subetapas) {
    const atuais = subetapasPorEtapa.get(subetapa.etapa_template_id) ?? []
    atuais.push(subetapa)
    subetapasPorEtapa.set(subetapa.etapa_template_id, atuais)
  }

  return ordenarPorOrdemNome(etapas).map((etapa) => ({
    etapa,
    subetapas: ordenarPorOrdemNome(subetapasPorEtapa.get(etapa.id) ?? []),
  }))
}

export function agruparEstrutura(
  pavimentos: Pavimento[],
  etapas: Etapa[],
  subetapas: Subetapa[],
): EstruturaAgrupada {
  const subetapasPorEtapa = new Map<string, Subetapa[]>()

  for (const subetapa of subetapas) {
    const atuais = subetapasPorEtapa.get(subetapa.etapa_id) ?? []
    atuais.push(subetapa)
    subetapasPorEtapa.set(subetapa.etapa_id, atuais)
  }

  const etapasComSubetapas = ordenarPorOrdemNome(etapas).map((etapa) => ({
    ...etapa,
    subetapas: ordenarPorOrdemNome(subetapasPorEtapa.get(etapa.id) ?? []),
  }))

  const etapasPorPavimento = new Map<string, EtapaComSubetapas[]>()
  const etapasGerais: EtapaComSubetapas[] = []

  for (const etapa of etapasComSubetapas) {
    if (!etapa.pavimento_id) {
      etapasGerais.push(etapa)
      continue
    }

    const atuais = etapasPorPavimento.get(etapa.pavimento_id) ?? []
    atuais.push(etapa)
    etapasPorPavimento.set(etapa.pavimento_id, atuais)
  }

  return {
    pavimentos: ordenarPorOrdemNome(pavimentos).map((pavimento) => ({
      ...pavimento,
      etapas: etapasPorPavimento.get(pavimento.id) ?? [],
    })),
    etapasGerais,
  }
}

export function resumirEstrutura(etapas: Etapa[], subetapas: Subetapa[]): ResumoEstrutura {
  return {
    totalEtapas: etapas.length,
    totalSubetapas: subetapas.length,
    subetapasConcluidas: subetapas.filter((subetapa) => subetapa.progresso >= 100)
      .length,
  }
}

export function contarItensPlanejados(
  pavimentos: string[],
  templates: TemplateSelecionado[],
): ResumoEstrutura {
  const totalEtapas = pavimentos.length * templates.length
  const subetapasPorPavimento = templates.reduce(
    (total, template) => total + template.subetapas.length,
    0,
  )

  return {
    totalEtapas,
    totalSubetapas: pavimentos.length * subetapasPorPavimento,
    subetapasConcluidas: 0,
  }
}
