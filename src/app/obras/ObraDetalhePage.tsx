import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Card,
  CardConteudo,
  EmptyState,
  Input,
  Modal,
  ProgressBar,
  Spinner,
  Tabs,
  Textarea,
  useToast,
} from '@/shared/components'
import { IconeProgresso } from '@/shared/components/icones'
import { useAuth } from '@/shared/auth/AuthProvider'
import { formatarData, formatarMetragem } from '@/shared/lib/formatacao'
import type { Etapa, Obra, StatusObra, Subetapa } from '@/shared/types/database'
import { agruparEstrutura, type EtapaComSubetapas } from './estrutura'
import {
  arquivarObra,
  atualizarObra,
  atualizarSubetapa,
  buscarEstruturaObra,
  buscarObra,
  excluirObra,
  salvarEtapaEstrutura,
} from './obrasApi'

type AbaDetalhe = 'visao' | 'estrutura'

const classeCampo =
  'h-11 w-full rounded-lg border border-borda bg-superficie px-3.5 text-texto focus:border-texto-suave focus:outline-none'

const statusRotulo: Record<StatusObra, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  arquivada: 'Arquivada',
}

function numeroPositivo(valor: string, fallback: number): number {
  const numero = Number(valor.replace(',', '.'))
  return Number.isFinite(numero) && numero >= 0 ? numero : fallback
}

function limparTexto(valor: string): string | null {
  const texto = valor.trim()
  return texto.length > 0 ? texto : null
}

function EditarObraModal({
  obra,
  aberto,
  salvando,
  podeExcluir,
  aoFechar,
  aoSalvar,
  aoArquivar,
  aoExcluir,
}: {
  obra: Obra
  aberto: boolean
  salvando: boolean
  podeExcluir: boolean
  aoFechar: () => void
  aoSalvar: (valores: {
    nome: string
    endereco: string | null
    metragem_m2: number | null
    status: StatusObra
    data_inicio: string | null
    previsao_entrega: string | null
    capa_url: string | null
    financeiro_visivel_cliente: boolean
  }) => void
  aoArquivar: () => void
  aoExcluir: () => void
}) {
  const [nome, setNome] = useState(obra.nome)
  const [endereco, setEndereco] = useState(obra.endereco ?? '')
  const [metragem, setMetragem] = useState(obra.metragem_m2?.toString() ?? '')
  const [status, setStatus] = useState<StatusObra>(obra.status)
  const [dataInicio, setDataInicio] = useState(obra.data_inicio ?? '')
  const [previsaoEntrega, setPrevisaoEntrega] = useState(obra.previsao_entrega ?? '')
  const [capaUrl, setCapaUrl] = useState(obra.capa_url ?? '')
  const [financeiroVisivel, setFinanceiroVisivel] = useState(
    obra.financeiro_visivel_cliente,
  )

  useEffect(() => {
    setNome(obra.nome)
    setEndereco(obra.endereco ?? '')
    setMetragem(obra.metragem_m2?.toString() ?? '')
    setStatus(obra.status)
    setDataInicio(obra.data_inicio ?? '')
    setPrevisaoEntrega(obra.previsao_entrega ?? '')
    setCapaUrl(obra.capa_url ?? '')
    setFinanceiroVisivel(obra.financeiro_visivel_cliente)
  }, [obra])

  function salvar() {
    aoSalvar({
      nome: nome.trim(),
      endereco: limparTexto(endereco),
      metragem_m2: metragem.trim() ? numeroPositivo(metragem, obra.metragem_m2 ?? 0) : null,
      status,
      data_inicio: limparTexto(dataInicio),
      previsao_entrega: limparTexto(previsaoEntrega),
      capa_url: limparTexto(capaUrl),
      financeiro_visivel_cliente: financeiroVisivel,
    })
  }

  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo="Editar obra"
      larguraMax="max-w-2xl"
      rodape={
        <>
          <Button variante="secundario" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button carregando={salvando} onClick={salvar}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Nome" value={nome} onChange={(e) => setNome(e.currentTarget.value)} />
        <Input
          label="Metragem"
          type="number"
          min="0"
          step="0.01"
          value={metragem}
          onChange={(e) => setMetragem(e.currentTarget.value)}
        />
        <div className="space-y-1.5">
          <label className="rotulo-editorial block" htmlFor="editar-status">
            Status
          </label>
          <select
            id="editar-status"
            className={classeCampo}
            value={status}
            onChange={(e) => setStatus(e.currentTarget.value as StatusObra)}
          >
            <option value="ativa">Ativa</option>
            <option value="pausada">Pausada</option>
            <option value="arquivada">Arquivada</option>
          </select>
        </div>
        <Input
          label="Data de início"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.currentTarget.value)}
        />
        <Input
          label="Previsao de entrega"
          type="date"
          value={previsaoEntrega}
          onChange={(e) => setPrevisaoEntrega(e.currentTarget.value)}
        />
        <Input
          label="URL da capa"
          value={capaUrl}
          onChange={(e) => setCapaUrl(e.currentTarget.value)}
        />
        <div className="md:col-span-2">
          <Textarea
            label="Endereço"
            value={endereco}
            onChange={(e) => setEndereco(e.currentTarget.value)}
          />
        </div>
        <label className="flex items-center gap-3 rounded-lg border border-borda px-3.5 py-3 text-sm md:col-span-2">
          <input
            type="checkbox"
            checked={financeiroVisivel}
            onChange={(e) => setFinanceiroVisivel(e.currentTarget.checked)}
            className="h-4 w-4"
          />
          Cliente pode ver financeiro desta obra
        </label>
        <div className="flex flex-wrap gap-2 border-t border-borda pt-4 md:col-span-2">
          <Button variante="secundario" onClick={aoArquivar}>
            {obra.status === 'arquivada' ? 'Manter arquivada' : 'Arquivar obra'}
          </Button>
          {podeExcluir && (
            <Button variante="perigo" onClick={aoExcluir}>
              Excluir obra
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

function SubetapaEditor({
  subetapa,
  salvando,
  aoSalvar,
}: {
  subetapa: Subetapa
  salvando: boolean
  aoSalvar: (subetapaId: string, valores: Partial<Subetapa>) => void
}) {
  const [progresso, setProgresso] = useState(String(subetapa.progresso))
  const [peso, setPeso] = useState(String(subetapa.peso))
  const [ordem, setOrdem] = useState(String(subetapa.ordem))

  useEffect(() => {
    setProgresso(String(subetapa.progresso))
    setPeso(String(subetapa.peso))
    setOrdem(String(subetapa.ordem))
  }, [subetapa])

  const progressoNumero = Math.round(numeroPositivo(progresso, subetapa.progresso))

  return (
    <div className="rounded-lg bg-fundo px-3 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{subetapa.nome}</p>
          <ProgressBar valor={progressoNumero} altura="sm" className="mt-2" />
        </div>
        <div className="grid grid-cols-3 gap-2 lg:w-[22rem]">
          <Input
            label="Progresso"
            type="number"
            min="0"
            max="100"
            step="5"
            value={progresso}
            onChange={(e) => setProgresso(e.currentTarget.value)}
          />
          <Input
            label="Peso"
            type="number"
            min="0.1"
            step="0.1"
            value={peso}
            onChange={(e) => setPeso(e.currentTarget.value)}
          />
          <Input
            label="Ordem"
            type="number"
            min="0"
            value={ordem}
            onChange={(e) => setOrdem(e.currentTarget.value)}
          />
        </div>
        <Button
          tamanho="sm"
          carregando={salvando}
          onClick={() =>
            aoSalvar(subetapa.id, {
              progresso: Math.min(100, Math.max(0, progressoNumero)),
              peso: Math.max(0.1, numeroPositivo(peso, subetapa.peso)),
              ordem: Math.floor(numeroPositivo(ordem, subetapa.ordem)),
            })
          }
        >
          Salvar
        </Button>
      </div>
    </div>
  )
}

function EtapaEditor({
  etapa,
  todasEtapas,
  salvandoEtapa,
  salvandoSubetapaId,
  aoSalvarEtapa,
  aoSalvarSubetapa,
}: {
  etapa: EtapaComSubetapas
  todasEtapas: Etapa[]
  salvandoEtapa: boolean
  salvandoSubetapaId: string | null
  aoSalvarEtapa: (etapaId: string, valores: Partial<Etapa>) => void
  aoSalvarSubetapa: (subetapaId: string, valores: Partial<Subetapa>) => void
}) {
  const [peso, setPeso] = useState(String(etapa.peso))
  const [ordem, setOrdem] = useState(String(etapa.ordem))
  const [dependeDe, setDependeDe] = useState(etapa.depende_de ?? '')
  const [instalandoAgora, setInstalandoAgora] = useState(etapa.instalando_agora)

  useEffect(() => {
    setPeso(String(etapa.peso))
    setOrdem(String(etapa.ordem))
    setDependeDe(etapa.depende_de ?? '')
    setInstalandoAgora(etapa.instalando_agora)
  }, [etapa])

  return (
    <div className="rounded-lg border border-borda bg-superficie">
      <div className="space-y-3 border-b border-borda px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold">{etapa.nome}</h3>
              {etapa.instalando_agora && (
                <span className="rounded-full bg-destaque/10 px-2.5 py-1 text-xs font-semibold text-destaque">
                  Instalando agora
                </span>
              )}
            </div>
            <ProgressBar valor={etapa.progresso} mostrarRotulo className="mt-2 max-w-md" />
          </div>
          <div className="grid gap-2 sm:grid-cols-4 xl:w-[34rem]">
            <Input
              label="Peso"
              type="number"
              min="0.1"
              step="0.1"
              value={peso}
              onChange={(e) => setPeso(e.currentTarget.value)}
            />
            <Input
              label="Ordem"
              type="number"
              min="0"
              value={ordem}
              onChange={(e) => setOrdem(e.currentTarget.value)}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <label className="rotulo-editorial block" htmlFor={`dep-${etapa.id}`}>
                Depende de
              </label>
              <select
                id={`dep-${etapa.id}`}
                className={classeCampo}
                value={dependeDe}
                onChange={(e) => setDependeDe(e.currentTarget.value)}
              >
                <option value="">Sem dependência</option>
                {todasEtapas
                  .filter((item) => item.id !== etapa.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={instalandoAgora}
              onChange={(e) => setInstalandoAgora(e.currentTarget.checked)}
              className="h-4 w-4"
            />
            Marcar como frente ativa
          </label>
          <Button
            tamanho="sm"
            carregando={salvandoEtapa}
            onClick={() =>
              aoSalvarEtapa(etapa.id, {
                peso: Math.max(0.1, numeroPositivo(peso, etapa.peso)),
                ordem: Math.floor(numeroPositivo(ordem, etapa.ordem)),
                depende_de: dependeDe || null,
                instalando_agora: instalandoAgora,
              })
            }
          >
            Salvar etapa
          </Button>
        </div>
      </div>

      <div className="space-y-2 px-4 py-3">
        {etapa.subetapas.length === 0 ? (
          <p className="text-sm text-texto-suave">Esta etapa não tem subetapas.</p>
        ) : (
          etapa.subetapas.map((subetapa) => (
            <SubetapaEditor
              key={subetapa.id}
              subetapa={subetapa}
              salvando={salvandoSubetapaId === subetapa.id}
              aoSalvar={aoSalvarSubetapa}
            />
          ))
        )}
      </div>
    </div>
  )
}

export function ObraDetalhePage() {
  const { obraId } = useParams()
  const navegar = useNavigate()
  const queryClient = useQueryClient()
  const { perfil } = useAuth()
  const { exibirToast } = useToast()
  const [aba, setAba] = useState<AbaDetalhe>('visao')
  const [modalAberto, setModalAberto] = useState(false)
  const [salvandoSubetapaId, setSalvandoSubetapaId] = useState<string | null>(null)

  const obraQuery = useQuery({
    queryKey: ['obra', obraId],
    queryFn: () => buscarObra(obraId ?? ''),
    enabled: Boolean(obraId),
  })
  const estruturaQuery = useQuery({
    queryKey: ['obra', obraId, 'estrutura'],
    queryFn: () => buscarEstruturaObra(obraId ?? ''),
    enabled: Boolean(obraId),
  })

  const estrutura = useMemo(() => {
    if (!estruturaQuery.data) return null
    return agruparEstrutura(
      estruturaQuery.data.pavimentos,
      estruturaQuery.data.etapas,
      estruturaQuery.data.subetapas,
    )
  }, [estruturaQuery.data])

  async function invalidar() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['obras'] }),
      queryClient.invalidateQueries({ queryKey: ['obra', obraId] }),
    ])
  }

  const salvarObraMutation = useMutation({
    mutationFn: (valores: Parameters<typeof atualizarObra>[1]) =>
      atualizarObra(obraId ?? '', valores),
    onSuccess: async () => {
      await invalidar()
      setModalAberto(false)
      exibirToast('sucesso', 'Obra atualizada.')
    },
    onError: (error) => {
      exibirToast('erro', error instanceof Error ? error.message : 'Não foi possível salvar.')
    },
  })

  const arquivarMutation = useMutation({
    mutationFn: () => arquivarObra(obraId ?? ''),
    onSuccess: async () => {
      await invalidar()
      setModalAberto(false)
      exibirToast('sucesso', 'Obra arquivada.')
    },
  })

  const excluirMutation = useMutation({
    mutationFn: () => excluirObra(obraId ?? ''),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['obras'] })
      exibirToast('sucesso', 'Obra excluida.')
      navegar('/app/obras')
    },
  })

  const salvarEtapaMutation = useMutation({
    mutationFn: ({ etapaId, valores }: { etapaId: string; valores: Partial<Etapa> }) =>
      salvarEtapaEstrutura(obraId ?? '', etapaId, valores),
    onSuccess: async () => {
      await invalidar()
      exibirToast('sucesso', 'Etapa atualizada.')
    },
    onError: (error) => {
      exibirToast('erro', error instanceof Error ? error.message : 'Falha ao salvar etapa.')
    },
  })

  const salvarSubetapaMutation = useMutation({
    mutationFn: ({ subetapaId, valores }: { subetapaId: string; valores: Partial<Subetapa> }) =>
      atualizarSubetapa(subetapaId, valores),
    onMutate: ({ subetapaId }) => setSalvandoSubetapaId(subetapaId),
    onSuccess: async () => {
      await invalidar()
      exibirToast('sucesso', 'Progresso atualizado.')
    },
    onError: (error) => {
      exibirToast('erro', error instanceof Error ? error.message : 'Falha ao salvar subetapa.')
    },
    onSettled: () => setSalvandoSubetapaId(null),
  })

  if (!obraId) return <Navigate to="/app/obras" replace />

  if (obraQuery.isLoading || estruturaQuery.isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (obraQuery.isError || estruturaQuery.isError || !obraQuery.data || !estruturaQuery.data) {
    return (
      <EmptyState
        titulo="Obra não encontrada"
        descricao="Verifique se você tem acesso a esta obra."
        acao={
          <Link
            to="/app/obras"
            className="inline-flex h-10 items-center justify-center rounded-full bg-primaria px-4 text-sm font-semibold text-white"
          >
            Voltar para obras
          </Link>
        }
      />
    )
  }

  const obra = obraQuery.data
  const todasEtapas = estruturaQuery.data.etapas

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            to="/app/obras"
            className="text-sm font-semibold text-texto-suave hover:text-texto"
          >
            Voltar para obras
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <p className="rotulo-editorial">Obra</p>
            <span className="rounded-full bg-destaque/10 px-2.5 py-1 text-xs font-semibold text-destaque">
              {statusRotulo[obra.status]}
            </span>
          </div>
          <h1 className="mt-1 text-2xl">{obra.nome}</h1>
          <p className="mt-2 max-w-2xl text-sm text-texto-suave">
            {obra.endereco || 'Endereço não informado'}
          </p>
        </div>
        <Button onClick={() => setModalAberto(true)}>Editar obra</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardConteudo>
            <p className="rotulo-editorial">Progresso</p>
            <p className="mt-2 text-2xl font-semibold">{Math.round(obra.progresso)}%</p>
            <ProgressBar valor={obra.progresso} altura="sm" className="mt-3" />
          </CardConteudo>
        </Card>
        <Card>
          <CardConteudo>
            <p className="rotulo-editorial">Metragem</p>
            <p className="mt-2 text-lg font-semibold">
              {obra.metragem_m2 ? formatarMetragem(obra.metragem_m2) : '-'}
            </p>
          </CardConteudo>
        </Card>
        <Card>
          <CardConteudo>
            <p className="rotulo-editorial">Inicio</p>
            <p className="mt-2 text-lg font-semibold">
              {obra.data_inicio ? formatarData(obra.data_inicio) : '-'}
            </p>
          </CardConteudo>
        </Card>
        <Card>
          <CardConteudo>
            <p className="rotulo-editorial">Entrega</p>
            <p className="mt-2 text-lg font-semibold">
              {obra.previsao_entrega ? formatarData(obra.previsao_entrega) : '-'}
            </p>
          </CardConteudo>
        </Card>
      </div>

      <Tabs
        ativa={aba}
        aoMudar={(id) => setAba(id as AbaDetalhe)}
        abas={[
          { id: 'visao', rotulo: 'Visao geral' },
          { id: 'estrutura', rotulo: 'Estrutura', contador: todasEtapas.length },
        ]}
      />

      {aba === 'visao' && (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardConteudo className="space-y-4">
              <div className="flex items-center gap-3">
                <IconeProgresso className="h-6 w-6 text-destaque" />
                <div>
                  <h2 className="font-semibold">Progresso por etapa</h2>
                  <p className="text-sm text-texto-suave">
                    Os percentuais sao recalculados no banco ao salvar subetapas.
                  </p>
                </div>
              </div>
              {todasEtapas.length === 0 ? (
                <EmptyState titulo="Sem etapas" descricao="Crie etapas para acompanhar a obra." />
              ) : (
                <div className="space-y-3">
                  {todasEtapas.slice(0, 8).map((etapa) => (
                    <div key={etapa.id}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{etapa.nome}</span>
                        <span className="text-texto-suave">
                          {Math.round(etapa.progresso)}%
                        </span>
                      </div>
                      <ProgressBar valor={etapa.progresso} altura="sm" />
                    </div>
                  ))}
                </div>
              )}
            </CardConteudo>
          </Card>
          <Card>
            <CardConteudo className="space-y-3">
              <p className="rotulo-editorial">Frente ativa</p>
              {todasEtapas.find((etapa) => etapa.instalando_agora) ? (
                <div>
                  <h2 className="text-lg font-semibold">
                    {todasEtapas.find((etapa) => etapa.instalando_agora)?.nome}
                  </h2>
                  <p className="mt-1 text-sm text-texto-suave">
                    Marcada na tela de estrutura.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-texto-suave">
                  Nenhuma etapa marcada como frente ativa.
                </p>
              )}
            </CardConteudo>
          </Card>
        </div>
      )}

      {aba === 'estrutura' && estrutura && (
        <div className="space-y-5">
          {estrutura.pavimentos.map((pavimento) => (
            <section key={pavimento.id} className="space-y-3">
              <div>
                <p className="rotulo-editorial">Pavimento</p>
                <h2 className="mt-1 text-xl font-semibold">{pavimento.nome}</h2>
              </div>
              {pavimento.etapas.length === 0 ? (
                <EmptyState titulo="Sem etapas neste pavimento" />
              ) : (
                <div className="space-y-3">
                  {pavimento.etapas.map((etapa) => (
                    <EtapaEditor
                      key={etapa.id}
                      etapa={etapa}
                      todasEtapas={todasEtapas}
                      salvandoEtapa={salvarEtapaMutation.isPending}
                      salvandoSubetapaId={salvandoSubetapaId}
                      aoSalvarEtapa={(etapaId, valores) =>
                        salvarEtapaMutation.mutate({ etapaId, valores })
                      }
                      aoSalvarSubetapa={(subetapaId, valores) =>
                        salvarSubetapaMutation.mutate({ subetapaId, valores })
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <EditarObraModal
        obra={obra}
        aberto={modalAberto}
        salvando={salvarObraMutation.isPending}
        podeExcluir={perfil?.papel === 'admin'}
        aoFechar={() => setModalAberto(false)}
        aoSalvar={(valores) => salvarObraMutation.mutate(valores)}
        aoArquivar={() => {
          if (window.confirm('Arquivar esta obra?')) arquivarMutation.mutate()
        }}
        aoExcluir={() => {
          if (window.confirm('Excluir esta obra e toda a estrutura?')) excluirMutation.mutate()
        }}
      />
    </div>
  )
}
