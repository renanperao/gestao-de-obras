import { supabase } from '@/shared/lib/supabase'
import type {
  Database,
  Etapa,
  EtapaTemplate,
  Obra,
  Pavimento,
  StatusObra,
  Subetapa,
  SubetapaTemplate,
} from '@/shared/types/database'
import {
  agruparTemplates,
  resumirEstrutura,
  type TemplateComSubetapas,
  type TemplateSelecionado,
} from './estrutura'

type Tabela<N extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][N]

type ObraInsert = Tabela<'obras'>['Insert']
type ObraUpdate = Tabela<'obras'>['Update']
type PavimentoInsert = Tabela<'pavimentos'>['Insert']
type EtapaInsert = Tabela<'etapas'>['Insert']
type SubetapaInsert = Tabela<'subetapas'>['Insert']
type EtapaUpdate = Tabela<'etapas'>['Update']
type SubetapaUpdate = Tabela<'subetapas'>['Update']

export interface ObraResumo extends Obra {
  totalEtapas: number
  totalSubetapas: number
  subetapasConcluidas: number
  etapaAtual: string | null
}

export interface EstruturaObraDados {
  pavimentos: Pavimento[]
  etapas: Etapa[]
  subetapas: Subetapa[]
}

export interface NovaObraPayload {
  dados: {
    nome: string
    endereco: string | null
    metragem_m2: number | null
    status: StatusObra
    data_inicio: string | null
    previsao_entrega: string | null
    capa_url: string | null
    financeiro_visivel_cliente: boolean
  }
  pavimentos: string[]
  templates: TemplateSelecionado[]
  responsavelId: string
}

function exigirSemErro<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message)
  if (data === null) throw new Error('A consulta não retornou dados.')
  return data
}

function idsDaObra(obras: Obra[]): string[] {
  return obras.map((obra) => obra.id)
}

export async function listarObrasResumo(): Promise<ObraResumo[]> {
  const { data: obrasData, error: erroObras } = await supabase
    .from('obras')
    .select('*')
    .order('created_at', { ascending: false })

  const obras = exigirSemErro(obrasData, erroObras)
  if (obras.length === 0) return []

  const obraIds = idsDaObra(obras)
  const { data: etapasData, error: erroEtapas } = await supabase
    .from('etapas')
    .select('*')
    .in('obra_id', obraIds)
    .order('ordem', { ascending: true })

  const etapas = exigirSemErro(etapasData, erroEtapas)
  const { data: subetapasData, error: erroSubetapas } = await supabase
    .from('subetapas')
    .select('*')
    .in('obra_id', obraIds)

  const subetapas = exigirSemErro(subetapasData, erroSubetapas)

  return obras.map((obra) => {
    const etapasDaObra = etapas.filter((etapa) => etapa.obra_id === obra.id)
    const subetapasDaObra = subetapas.filter((subetapa) => subetapa.obra_id === obra.id)
    const resumo = resumirEstrutura(etapasDaObra, subetapasDaObra)
    const etapaAtual =
      etapasDaObra.find((etapa) => etapa.instalando_agora)?.nome ?? null

    return {
      ...obra,
      ...resumo,
      etapaAtual,
    }
  })
}

export async function buscarObra(obraId: string): Promise<Obra> {
  const { data, error } = await supabase.from('obras').select('*').eq('id', obraId).single()
  return exigirSemErro(data, error)
}

export async function buscarEstruturaObra(obraId: string): Promise<EstruturaObraDados> {
  const [pavimentosResposta, etapasResposta, subetapasResposta] = await Promise.all([
    supabase
      .from('pavimentos')
      .select('*')
      .eq('obra_id', obraId)
      .order('ordem', { ascending: true }),
    supabase
      .from('etapas')
      .select('*')
      .eq('obra_id', obraId)
      .order('ordem', { ascending: true }),
    supabase
      .from('subetapas')
      .select('*')
      .eq('obra_id', obraId)
      .order('ordem', { ascending: true }),
  ])

  return {
    pavimentos: exigirSemErro(pavimentosResposta.data, pavimentosResposta.error),
    etapas: exigirSemErro(etapasResposta.data, etapasResposta.error),
    subetapas: exigirSemErro(subetapasResposta.data, subetapasResposta.error),
  }
}

export async function listarTemplatesComSubetapas(): Promise<TemplateComSubetapas[]> {
  const [etapasResposta, subetapasResposta] = await Promise.all([
    supabase
      .from('etapa_templates')
      .select('*')
      .order('ordem', { ascending: true }),
    supabase
      .from('subetapa_templates')
      .select('*')
      .order('ordem', { ascending: true }),
  ])

  const etapas = exigirSemErro<EtapaTemplate[]>(etapasResposta.data, etapasResposta.error)
  const subetapas = exigirSemErro<SubetapaTemplate[]>(
    subetapasResposta.data,
    subetapasResposta.error,
  )

  return agruparTemplates(etapas, subetapas)
}

export async function criarObraComTemplate(payload: NovaObraPayload): Promise<string> {
  let obraCriadaId: string | null = null

  try {
    const novaObra: ObraInsert = {
      nome: payload.dados.nome,
      endereco: payload.dados.endereco,
      metragem_m2: payload.dados.metragem_m2,
      status: payload.dados.status,
      data_inicio: payload.dados.data_inicio,
      previsao_entrega: payload.dados.previsao_entrega,
      capa_url: payload.dados.capa_url,
      financeiro_visivel_cliente: payload.dados.financeiro_visivel_cliente,
    }

    const { data: obra, error: erroObra } = await supabase
      .from('obras')
      .insert(novaObra)
      .select()
      .single()

    const obraCriada = exigirSemErro(obra, erroObra)
    obraCriadaId = obraCriada.id

    const { error: erroMembro } = await supabase.from('obra_membros').insert({
      obra_id: obraCriada.id,
      perfil_id: payload.responsavelId,
      papel_na_obra: 'responsavel',
    })
    if (erroMembro) throw new Error(erroMembro.message)

    const pavimentosParaInserir: PavimentoInsert[] = payload.pavimentos.map(
      (nome, indice) => ({
        obra_id: obraCriada.id,
        nome,
        ordem: indice + 1,
      }),
    )

    const { data: pavimentos, error: erroPavimentos } = await supabase
      .from('pavimentos')
      .insert(pavimentosParaInserir)
      .select()

    const pavimentosCriados = exigirSemErro(pavimentos, erroPavimentos)

    const etapasParaInserir: EtapaInsert[] = pavimentosCriados.flatMap((pavimento) =>
      payload.templates.map((template) => ({
        obra_id: obraCriada.id,
        pavimento_id: pavimento.id,
        nome: template.nome,
        peso: template.peso,
        ordem: template.ordem,
        template_origem: template.templateId,
      })),
    )

    const { data: etapas, error: erroEtapas } = await supabase
      .from('etapas')
      .insert(etapasParaInserir)
      .select()

    const etapasCriadas = exigirSemErro(etapas, erroEtapas)
    const templatePorId = new Map(payload.templates.map((template) => [template.templateId, template]))

    const subetapasParaInserir: SubetapaInsert[] = etapasCriadas.flatMap((etapa) => {
      const template = etapa.template_origem
        ? templatePorId.get(etapa.template_origem)
        : undefined
      if (!template) return []

      return template.subetapas.map((subetapa) => ({
        obra_id: obraCriada.id,
        etapa_id: etapa.id,
        nome: subetapa.nome,
        peso: subetapa.peso,
        ordem: subetapa.ordem,
      }))
    })

    if (subetapasParaInserir.length > 0) {
      const { error: erroSubetapas } = await supabase
        .from('subetapas')
        .insert(subetapasParaInserir)
      if (erroSubetapas) throw new Error(erroSubetapas.message)
    }

    return obraCriada.id
  } catch (erro) {
    if (obraCriadaId) {
      await supabase.from('obras').delete().eq('id', obraCriadaId)
    }
    throw erro
  }
}

export async function atualizarObra(obraId: string, valores: ObraUpdate): Promise<Obra> {
  const { data, error } = await supabase
    .from('obras')
    .update(valores)
    .eq('id', obraId)
    .select()
    .single()

  return exigirSemErro(data, error)
}

export async function arquivarObra(obraId: string): Promise<void> {
  const { error } = await supabase.from('obras').update({ status: 'arquivada' }).eq('id', obraId)
  if (error) throw new Error(error.message)
}

export async function excluirObra(obraId: string): Promise<void> {
  const { error } = await supabase.from('obras').delete().eq('id', obraId)
  if (error) throw new Error(error.message)
}

export async function atualizarEtapa(etapaId: string, valores: EtapaUpdate): Promise<Etapa> {
  const { data, error } = await supabase
    .from('etapas')
    .update(valores)
    .eq('id', etapaId)
    .select()
    .single()

  return exigirSemErro(data, error)
}

export async function salvarEtapaEstrutura(
  obraId: string,
  etapaId: string,
  valores: EtapaUpdate,
): Promise<Etapa> {
  if (valores.instalando_agora === true) {
    const { error } = await supabase
      .from('etapas')
      .update({ instalando_agora: false })
      .eq('obra_id', obraId)
      .neq('id', etapaId)

    if (error) throw new Error(error.message)
  }

  return atualizarEtapa(etapaId, valores)
}

export async function atualizarSubetapa(
  subetapaId: string,
  valores: SubetapaUpdate,
): Promise<Subetapa> {
  const { data, error } = await supabase
    .from('subetapas')
    .update(valores)
    .eq('id', subetapaId)
    .select()
    .single()

  return exigirSemErro(data, error)
}
