/**
 * Tipos do schema Supabase.
 *
 * Escritos no formato do `supabase gen types typescript` para serem
 * substituídos pela geração automática assim que houver um projeto vinculado:
 *   supabase gen types typescript --linked > src/shared/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Papel = 'admin' | 'equipe' | 'cliente'
export type PapelNaObra = 'responsavel' | 'equipe' | 'cliente'
export type StatusObra = 'ativa' | 'pausada' | 'arquivada'
export type StatusConvite = 'pendente' | 'aceito' | 'expirado'
export type StatusCompra = 'cotando' | 'aprovado' | 'entregue' | 'cancelado'
export type OrigemCotacao = 'manual' | 'ia'
export type TipoFornecedor = 'fixo' | 'eventual'
export type TipoLancamento = 'pagar' | 'receber'
export type CategoriaLancamento =
  | 'material'
  | 'mao_de_obra'
  | 'servico'
  | 'taxa'
  | 'honorarios'
  | 'outro'

type PerfilRow = {
  id: string
  nome: string
  telefone: string | null
  papel: Papel
  avatar_url: string | null
  primeiro_acesso: boolean
  created_at: string
}
type PerfilInsert = {
  id: string
  nome: string
  telefone?: string | null
  papel: Papel
  avatar_url?: string | null
  primeiro_acesso?: boolean
  created_at?: string
}

type ObraRow = {
  id: string
  nome: string
  endereco: string | null
  metragem_m2: number | null
  status: StatusObra
  data_inicio: string | null
  previsao_entrega: string | null
  capa_url: string | null
  financeiro_visivel_cliente: boolean
  progresso: number
  created_at: string
  updated_at: string
}
type ObraInsert = {
  id?: string
  nome: string
  endereco?: string | null
  metragem_m2?: number | null
  status?: StatusObra
  data_inicio?: string | null
  previsao_entrega?: string | null
  capa_url?: string | null
  financeiro_visivel_cliente?: boolean
  progresso?: number
  created_at?: string
  updated_at?: string
}

type ObraMembroRow = {
  id: string
  obra_id: string
  perfil_id: string
  papel_na_obra: PapelNaObra
}
type ObraMembroInsert = {
  id?: string
  obra_id: string
  perfil_id: string
  papel_na_obra: PapelNaObra
}

type ConviteRow = {
  id: string
  obra_id: string
  email: string
  nome: string
  status: StatusConvite
  criado_por: string | null
  expira_em: string | null
  created_at: string
}
type ConviteInsert = {
  id?: string
  obra_id: string
  email: string
  nome: string
  status?: StatusConvite
  criado_por?: string | null
  expira_em?: string | null
  created_at?: string
}

type PavimentoRow = {
  id: string
  obra_id: string
  nome: string
  ordem: number
}
type PavimentoInsert = {
  id?: string
  obra_id: string
  nome: string
  ordem?: number
}

type EtapaTemplateRow = {
  id: string
  nome: string
  peso_sugerido: number
  ordem: number
  categoria: string | null
}
type EtapaTemplateInsert = {
  id?: string
  nome: string
  peso_sugerido?: number
  ordem?: number
  categoria?: string | null
}

type SubetapaTemplateRow = {
  id: string
  etapa_template_id: string
  nome: string
  peso_sugerido: number
  ordem: number
}
type SubetapaTemplateInsert = {
  id?: string
  etapa_template_id: string
  nome: string
  peso_sugerido?: number
  ordem?: number
}

type EtapaRow = {
  id: string
  obra_id: string
  pavimento_id: string | null
  nome: string
  peso: number
  ordem: number
  progresso: number
  instalando_agora: boolean
  depende_de: string | null
  template_origem: string | null
  created_at: string
}
type EtapaInsert = {
  id?: string
  obra_id: string
  pavimento_id?: string | null
  nome: string
  peso?: number
  ordem?: number
  progresso?: number
  instalando_agora?: boolean
  depende_de?: string | null
  template_origem?: string | null
  created_at?: string
}

type SubetapaRow = {
  id: string
  etapa_id: string
  obra_id: string
  nome: string
  peso: number
  ordem: number
  progresso: number
}
type SubetapaInsert = {
  id?: string
  etapa_id: string
  obra_id: string
  nome: string
  peso?: number
  ordem?: number
  progresso?: number
}

type FotoRow = {
  id: string
  obra_id: string
  etapa_id: string | null
  subetapa_id: string | null
  storage_path: string
  thumb_path: string | null
  legenda: string | null
  percentual_registrado: number | null
  visivel_cliente: boolean
  criado_por: string | null
  created_at: string
}
type FotoInsert = {
  id?: string
  obra_id: string
  etapa_id?: string | null
  subetapa_id?: string | null
  storage_path: string
  thumb_path?: string | null
  legenda?: string | null
  percentual_registrado?: number | null
  visivel_cliente?: boolean
  criado_por?: string | null
  created_at?: string
}

type AvisoRow = {
  id: string
  obra_id: string
  titulo: string
  mensagem: string
  criado_por: string | null
  created_at: string
}
type AvisoInsert = {
  id?: string
  obra_id: string
  titulo: string
  mensagem: string
  criado_por?: string | null
  created_at?: string
}

type AtividadeRow = {
  id: string
  obra_id: string
  tipo: string
  payload: Json
  visivel_cliente: boolean
  ator: string | null
  created_at: string
}
type AtividadeInsert = {
  id?: string
  obra_id: string
  tipo: string
  payload?: Json
  visivel_cliente?: boolean
  ator?: string | null
  created_at?: string
}

type CompromissoRow = {
  id: string
  obra_id: string
  titulo: string
  descricao: string | null
  data_hora: string
  visivel_cliente: boolean
  criado_por: string | null
  created_at: string
}
type CompromissoInsert = {
  id?: string
  obra_id: string
  titulo: string
  descricao?: string | null
  data_hora: string
  visivel_cliente?: boolean
  criado_por?: string | null
  created_at?: string
}

type FornecedorRow = {
  id: string
  nome: string
  tipo: TipoFornecedor
  cnpj: string | null
  contato: string | null
  email: string | null
  observacoes: string | null
  created_at: string
}
type FornecedorInsert = {
  id?: string
  nome: string
  tipo?: TipoFornecedor
  cnpj?: string | null
  contato?: string | null
  email?: string | null
  observacoes?: string | null
  created_at?: string
}

type ItemCatalogoRow = {
  id: string
  nome: string
  unidade: string
  categoria: string | null
}
type ItemCatalogoInsert = {
  id?: string
  nome: string
  unidade: string
  categoria?: string | null
}

type CompraRow = {
  id: string
  obra_id: string
  etapa_id: string | null
  item_catalogo_id: string | null
  descricao: string
  quantidade: number
  unidade: string
  status: StatusCompra
  data_compra: string | null
  previsao_entrega: string | null
  data_entrega: string | null
  criado_por: string | null
  created_at: string
}
type CompraInsert = {
  id?: string
  obra_id: string
  etapa_id?: string | null
  item_catalogo_id?: string | null
  descricao: string
  quantidade: number
  unidade: string
  status?: StatusCompra
  data_compra?: string | null
  previsao_entrega?: string | null
  data_entrega?: string | null
  criado_por?: string | null
  created_at?: string
}

type CotacaoRow = {
  id: string
  compra_id: string
  obra_id: string
  fornecedor_id: string | null
  fornecedor_nome_livre: string | null
  valor_unitario: number
  frete: number
  escolhida: boolean
  origem: OrigemCotacao
  arquivo_origem_path: string | null
  observacoes: string | null
  created_at: string
}
type CotacaoInsert = {
  id?: string
  compra_id: string
  obra_id: string
  fornecedor_id?: string | null
  fornecedor_nome_livre?: string | null
  valor_unitario: number
  frete?: number
  escolhida?: boolean
  origem?: OrigemCotacao
  arquivo_origem_path?: string | null
  observacoes?: string | null
  created_at?: string
}

type LancamentoRow = {
  id: string
  obra_id: string
  etapa_id: string | null
  compra_id: string | null
  tipo: TipoLancamento
  categoria: CategoriaLancamento
  descricao: string
  valor: number
  vencimento: string | null
  pago_em: string | null
  economia_negociacao: number
  visivel_cliente: boolean
  criado_por: string | null
  created_at: string
}
type LancamentoInsert = {
  id?: string
  obra_id: string
  etapa_id?: string | null
  compra_id?: string | null
  tipo: TipoLancamento
  categoria: CategoriaLancamento
  descricao: string
  valor: number
  vencimento?: string | null
  pago_em?: string | null
  economia_negociacao?: number
  visivel_cliente?: boolean
  criado_por?: string | null
  created_at?: string
}

type AmbienteRow = {
  id: string
  obra_id: string
  pavimento_id: string | null
  nome: string
  area_m2: number
  desconto_m2: number
}
type AmbienteInsert = {
  id?: string
  obra_id: string
  pavimento_id?: string | null
  nome: string
  area_m2: number
  desconto_m2?: number
}

type QuantitativoItemRow = {
  id: string
  obra_id: string
  ambiente_id: string | null
  item_catalogo_id: string | null
  descricao: string
  consumo_por_m2: number | null
  indice_perda_pct: number
  quantidade_calculada: number | null
  quantidade_ajustada: number | null
  unidade: string
}
type QuantitativoItemInsert = {
  id?: string
  obra_id: string
  ambiente_id?: string | null
  item_catalogo_id?: string | null
  descricao: string
  consumo_por_m2?: number | null
  indice_perda_pct?: number
  quantidade_calculada?: number | null
  quantidade_ajustada?: number | null
  unidade: string
}

type ConfiguracaoEscritorioRow = {
  id: number
  nome_escritorio: string
  logo_url: string | null
  cor_primaria: string
  cor_destaque: string
  slogan: string | null
}
type ConfiguracaoEscritorioInsert = {
  id?: number
  nome_escritorio: string
  logo_url?: string | null
  cor_primaria?: string
  cor_destaque?: string
  slogan?: string | null
}

/** Shape esperado pelo postgrest-js (GenericTable exige Relationships). */
type Tabela<Row, Insert> = {
  Row: Row
  Insert: Insert
  Update: Partial<Insert>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      perfis: Tabela<PerfilRow, PerfilInsert>
      obras: Tabela<ObraRow, ObraInsert>
      obra_membros: Tabela<ObraMembroRow, ObraMembroInsert>
      convites: Tabela<ConviteRow, ConviteInsert>
      pavimentos: Tabela<PavimentoRow, PavimentoInsert>
      etapa_templates: Tabela<EtapaTemplateRow, EtapaTemplateInsert>
      subetapa_templates: Tabela<SubetapaTemplateRow, SubetapaTemplateInsert>
      etapas: Tabela<EtapaRow, EtapaInsert>
      subetapas: Tabela<SubetapaRow, SubetapaInsert>
      fotos: Tabela<FotoRow, FotoInsert>
      avisos: Tabela<AvisoRow, AvisoInsert>
      atividades: Tabela<AtividadeRow, AtividadeInsert>
      compromissos: Tabela<CompromissoRow, CompromissoInsert>
      fornecedores: Tabela<FornecedorRow, FornecedorInsert>
      itens_catalogo: Tabela<ItemCatalogoRow, ItemCatalogoInsert>
      compras: Tabela<CompraRow, CompraInsert>
      cotacoes: Tabela<CotacaoRow, CotacaoInsert>
      lancamentos: Tabela<LancamentoRow, LancamentoInsert>
      ambientes: Tabela<AmbienteRow, AmbienteInsert>
      quantitativo_itens: Tabela<QuantitativoItemRow, QuantitativoItemInsert>
      configuracao_escritorio: Tabela<ConfiguracaoEscritorioRow, ConfiguracaoEscritorioInsert>
    }
    Views: {
      cotacoes_comparativo: {
        Row: CotacaoRow & { total: number }
        Relationships: []
      }
    }
    Functions: {
      eh_admin: { Args: Record<string, never>; Returns: boolean }
      eh_equipe: { Args: Record<string, never>; Returns: boolean }
      eh_membro_da_obra: { Args: { p_obra: string }; Returns: boolean }
      eh_equipe_da_obra: { Args: { p_obra: string }; Returns: boolean }
      eh_cliente_da_obra: { Args: { p_obra: string }; Returns: boolean }
    }
  }
}

// Aliases de conveniência para o domínio
export type Perfil = PerfilRow
export type Obra = ObraRow
export type ObraMembro = ObraMembroRow
export type Convite = ConviteRow
export type Pavimento = PavimentoRow
export type EtapaTemplate = EtapaTemplateRow
export type SubetapaTemplate = SubetapaTemplateRow
export type Etapa = EtapaRow
export type Subetapa = SubetapaRow
export type Foto = FotoRow
export type Aviso = AvisoRow
export type Atividade = AtividadeRow
export type Compromisso = CompromissoRow
export type Fornecedor = FornecedorRow
export type ItemCatalogo = ItemCatalogoRow
export type Compra = CompraRow
export type Cotacao = CotacaoRow
export type Lancamento = LancamentoRow
export type Ambiente = AmbienteRow
export type QuantitativoItem = QuantitativoItemRow
export type ConfiguracaoEscritorio = ConfiguracaoEscritorioRow
