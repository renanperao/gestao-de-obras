import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth/AuthProvider'
import {
  Button,
  Card,
  CardConteudo,
  EmptyState,
  Input,
  Spinner,
  Textarea,
  useToast,
} from '@/shared/components'
import { IconeObra } from '@/shared/components/icones'
import { cn } from '@/shared/lib/cn'
import type { StatusObra } from '@/shared/types/database'
import {
  contarItensPlanejados,
  criarNomesPavimentos,
  type TemplateComSubetapas,
  type TemplateSelecionado,
} from './estrutura'
import { criarObraComTemplate, listarTemplatesComSubetapas } from './obrasApi'

type Passo = 0 | 1 | 2 | 3

interface DadosObraForm {
  nome: string
  endereco: string
  metragem_m2: string
  status: StatusObra
  data_inicio: string
  previsao_entrega: string
  capa_url: string
  financeiro_visivel_cliente: boolean
}

interface AjusteSubetapa {
  selecionado: boolean
  peso: string
  ordem: string
}

interface AjusteTemplate {
  selecionado: boolean
  peso: string
  ordem: string
  subetapas: Record<string, AjusteSubetapa>
}

type AjustesTemplate = Record<string, AjusteTemplate>

const passos: Array<{ id: Passo; rotulo: string }> = [
  { id: 0, rotulo: 'Dados' },
  { id: 1, rotulo: 'Pavimentos' },
  { id: 2, rotulo: 'Template' },
  { id: 3, rotulo: 'Revisão' },
]

const classeCampo =
  'h-11 w-full rounded-lg border border-borda bg-superficie px-3.5 text-texto focus:border-texto-suave focus:outline-none'

function criarAjustes(templates: TemplateComSubetapas[]): AjustesTemplate {
  return Object.fromEntries(
    templates.map((template) => [
      template.etapa.id,
      {
        selecionado: true,
        peso: String(template.etapa.peso_sugerido),
        ordem: String(template.etapa.ordem),
        subetapas: Object.fromEntries(
          template.subetapas.map((subetapa) => [
            subetapa.id,
            {
              selecionado: true,
              peso: String(subetapa.peso_sugerido),
              ordem: String(subetapa.ordem),
            },
          ]),
        ),
      },
    ]),
  )
}

function numeroPositivo(valor: string, fallback: number): number {
  const numero = Number(valor.replace(',', '.'))
  return Number.isFinite(numero) && numero > 0 ? numero : fallback
}

function limparTexto(valor: string): string | null {
  const texto = valor.trim()
  return texto.length > 0 ? texto : null
}

function obterTemplatesSelecionados(
  templates: TemplateComSubetapas[],
  ajustes: AjustesTemplate,
): TemplateSelecionado[] {
  return templates.flatMap((template) => {
    const ajuste = ajustes[template.etapa.id]
    if (!ajuste?.selecionado) return []

    const subetapas = template.subetapas.flatMap((subetapa) => {
      const ajusteSubetapa = ajuste.subetapas[subetapa.id]
      if (!ajusteSubetapa?.selecionado) return []

      return {
        templateId: subetapa.id,
        nome: subetapa.nome,
        peso: numeroPositivo(ajusteSubetapa.peso, subetapa.peso_sugerido),
        ordem: Math.max(0, Math.floor(numeroPositivo(ajusteSubetapa.ordem, subetapa.ordem))),
      }
    })

    if (subetapas.length === 0) return []

    return {
      templateId: template.etapa.id,
      nome: template.etapa.nome,
      peso: numeroPositivo(ajuste.peso, template.etapa.peso_sugerido),
      ordem: Math.max(0, Math.floor(numeroPositivo(ajuste.ordem, template.etapa.ordem))),
      subetapas,
    }
  })
}

export function NovaObraPage() {
  const navegar = useNavigate()
  const queryClient = useQueryClient()
  const { perfil } = useAuth()
  const { exibirToast } = useToast()
  const [passo, setPasso] = useState<Passo>(0)
  const [erro, setErro] = useState<string | null>(null)
  const [dados, setDados] = useState<DadosObraForm>({
    nome: '',
    endereco: '',
    metragem_m2: '',
    status: 'ativa',
    data_inicio: '',
    previsao_entrega: '',
    capa_url: '',
    financeiro_visivel_cliente: false,
  })
  const [quantidadePavimentos, setQuantidadePavimentos] = useState('3')
  const [pavimentos, setPavimentos] = useState(() => criarNomesPavimentos(3))
  const [ajustes, setAjustes] = useState<AjustesTemplate>({})

  const templatesQuery = useQuery({
    queryKey: ['etapa-templates'],
    queryFn: listarTemplatesComSubetapas,
  })

  useEffect(() => {
    if (templatesQuery.data && Object.keys(ajustes).length === 0) {
      setAjustes(criarAjustes(templatesQuery.data))
    }
  }, [templatesQuery.data, ajustes])

  const templatesSelecionados = useMemo(
    () => obterTemplatesSelecionados(templatesQuery.data ?? [], ajustes),
    [templatesQuery.data, ajustes],
  )
  const pavimentosValidos = useMemo(
    () => pavimentos.map((pavimento) => pavimento.trim()).filter(Boolean),
    [pavimentos],
  )
  const resumoPlanejado = useMemo(
    () => contarItensPlanejados(pavimentosValidos, templatesSelecionados),
    [pavimentosValidos, templatesSelecionados],
  )

  const criarObraMutation = useMutation({
    mutationFn: criarObraComTemplate,
    onSuccess: async (obraId) => {
      await queryClient.invalidateQueries({ queryKey: ['obras'] })
      exibirToast('sucesso', 'Obra criada com estrutura pronta.')
      navegar(`/app/obras/${obraId}`)
    },
    onError: (error) => {
      exibirToast('erro', error instanceof Error ? error.message : 'Não foi possível criar a obra.')
    },
  })

  function alterarDados<K extends keyof DadosObraForm>(
    campo: K,
    valor: DadosObraForm[K],
  ) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }))
  }

  function validarPasso(atual: Passo): boolean {
    setErro(null)

    if (atual === 0 && !dados.nome.trim()) {
      setErro('Informe o nome da obra.')
      return false
    }

    if (atual === 1 && pavimentosValidos.length === 0) {
      setErro('Informe ao menos um pavimento.')
      return false
    }

    if (atual === 2 && templatesSelecionados.length === 0) {
      setErro('Selecione ao menos uma etapa com subetapas.')
      return false
    }

    return true
  }

  function avancar() {
    if (!validarPasso(passo)) return
    setPasso((atual) => Math.min(3, atual + 1) as Passo)
  }

  function voltar() {
    setErro(null)
    setPasso((atual) => Math.max(0, atual - 1) as Passo)
  }

  function aplicarQuantidadePavimentos() {
    const quantidade = Number(quantidadePavimentos)
    setPavimentos(criarNomesPavimentos(quantidade))
  }

  function atualizarPavimento(indice: number, nome: string) {
    setPavimentos((atuais) =>
      atuais.map((atual, indiceAtual) => (indiceAtual === indice ? nome : atual)),
    )
  }

  function removerPavimento(indice: number) {
    setPavimentos((atuais) => atuais.filter((_, indiceAtual) => indiceAtual !== indice))
  }

  function atualizarAjusteTemplate(
    templateId: string,
    atualizacao: Partial<Omit<AjusteTemplate, 'subetapas'>>,
  ) {
    setAjustes((atuais) => ({
      ...atuais,
      [templateId]: {
        ...atuais[templateId],
        ...atualizacao,
      },
    }))
  }

  function atualizarAjusteSubetapa(
    templateId: string,
    subetapaId: string,
    atualizacao: Partial<AjusteSubetapa>,
  ) {
    setAjustes((atuais) => ({
      ...atuais,
      [templateId]: {
        ...atuais[templateId],
        subetapas: {
          ...atuais[templateId]?.subetapas,
          [subetapaId]: {
            ...atuais[templateId]?.subetapas[subetapaId],
            ...atualizacao,
          },
        },
      },
    }))
  }

  async function salvar() {
    if (!perfil || !validarPasso(3)) return

    await criarObraMutation.mutateAsync({
      responsavelId: perfil.id,
      dados: {
        nome: dados.nome.trim(),
        endereco: limparTexto(dados.endereco),
        metragem_m2: dados.metragem_m2.trim()
          ? numeroPositivo(dados.metragem_m2, 0)
          : null,
        status: dados.status,
        data_inicio: limparTexto(dados.data_inicio),
        previsao_entrega: limparTexto(dados.previsao_entrega),
        capa_url: limparTexto(dados.capa_url),
        financeiro_visivel_cliente: dados.financeiro_visivel_cliente,
      },
      pavimentos: pavimentosValidos,
      templates: templatesSelecionados,
    })
  }

  if (perfil?.papel !== 'admin') {
    return (
      <EmptyState
        titulo="Apenas administradores criam obras"
        descricao="A equipe pode atualizar estrutura e progresso nas obras em que participa."
      />
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          to="/app/obras"
          className="text-sm font-semibold text-texto-suave hover:text-texto"
        >
          Voltar para obras
        </Link>
        <p className="rotulo-editorial mt-4">Nova obra</p>
        <h1 className="mt-1 text-2xl">Criar obra com estrutura</h1>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {passos.map((item) => {
          const ativo = item.id === passo
          const concluido = item.id < passo
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id < passo || validarPasso(passo)) setPasso(item.id)
              }}
              className={cn(
                'rounded-lg border px-2 py-3 text-center text-xs font-semibold sm:text-sm',
                ativo && 'border-destaque bg-destaque/10 text-destaque',
                concluido && 'border-primaria bg-primaria text-white',
                !ativo && !concluido && 'border-borda bg-superficie text-texto-suave',
              )}
            >
              {item.rotulo}
            </button>
          )
        })}
      </div>

      <Card>
        <CardConteudo className="space-y-5">
          {passo === 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Nome da obra"
                value={dados.nome}
                onChange={(evento) => alterarDados('nome', evento.currentTarget.value)}
                placeholder="Residencia Silva"
              />
              <Input
                label="Metragem"
                type="number"
                min="0"
                step="0.01"
                value={dados.metragem_m2}
                onChange={(evento) =>
                  alterarDados('metragem_m2', evento.currentTarget.value)
                }
                placeholder="180"
              />
              <Textarea
                label="Endereço"
                value={dados.endereco}
                onChange={(evento) =>
                  alterarDados('endereco', evento.currentTarget.value)
                }
                className="md:col-span-2"
              />
              <Input
                label="Data de início"
                type="date"
                value={dados.data_inicio}
                onChange={(evento) =>
                  alterarDados('data_inicio', evento.currentTarget.value)
                }
              />
              <Input
                label="Previsao de entrega"
                type="date"
                value={dados.previsao_entrega}
                onChange={(evento) =>
                  alterarDados('previsao_entrega', evento.currentTarget.value)
                }
              />
              <Input
                label="URL da capa"
                value={dados.capa_url}
                onChange={(evento) =>
                  alterarDados('capa_url', evento.currentTarget.value)
                }
                className="md:col-span-2"
                placeholder="https://..."
              />
              <div className="space-y-1.5">
                <label className="rotulo-editorial block" htmlFor="status-obra">
                  Status inicial
                </label>
                <select
                  id="status-obra"
                  className={classeCampo}
                  value={dados.status}
                  onChange={(evento) =>
                    alterarDados('status', evento.currentTarget.value as StatusObra)
                  }
                >
                  <option value="ativa">Ativa</option>
                  <option value="pausada">Pausada</option>
                  <option value="arquivada">Arquivada</option>
                </select>
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-borda px-3.5 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={dados.financeiro_visivel_cliente}
                  onChange={(evento) =>
                    alterarDados(
                      'financeiro_visivel_cliente',
                      evento.currentTarget.checked,
                    )
                  }
                  className="h-4 w-4 rounded border-borda"
                />
                Cliente pode ver financeiro desta obra
              </label>
            </div>
          )}

          {passo === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Input
                  label="Quantidade de pavimentos"
                  type="number"
                  min="1"
                  max="20"
                  value={quantidadePavimentos}
                  onChange={(evento) =>
                    setQuantidadePavimentos(evento.currentTarget.value)
                  }
                />
                <Button onClick={aplicarQuantidadePavimentos}>Gerar nomes</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {pavimentos.map((pavimento, indice) => (
                  <div key={`${indice}-${pavimento}`} className="flex gap-2">
                    <Input
                      label={`Pavimento ${indice + 1}`}
                      value={pavimento}
                      onChange={(evento) =>
                        atualizarPavimento(indice, evento.currentTarget.value)
                      }
                    />
                    {pavimentos.length > 1 && (
                      <Button
                        variante="fantasma"
                        className="mt-6 shrink-0"
                        onClick={() => removerPavimento(indice)}
                      >
                        Remover
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {passo === 2 && (
            <div className="space-y-4">
              {templatesQuery.isLoading && (
                <div className="flex min-h-40 items-center justify-center">
                  <Spinner />
                </div>
              )}
              {templatesQuery.isError && (
                <EmptyState
                  titulo="Templates indisponiveis"
                  descricao="Não foi possível carregar as etapas padrão."
                />
              )}
              {templatesQuery.data?.map((template) => {
                const ajuste = ajustes[template.etapa.id]
                return (
                  <div
                    key={template.etapa.id}
                    className="rounded-lg border border-borda bg-superficie px-4 py-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex items-center gap-3 font-semibold">
                        <input
                          type="checkbox"
                          checked={ajuste?.selecionado ?? false}
                          onChange={(evento) =>
                            atualizarAjusteTemplate(template.etapa.id, {
                              selecionado: evento.currentTarget.checked,
                            })
                          }
                          className="h-4 w-4"
                        />
                        {template.etapa.nome}
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:w-56">
                        <Input
                          label="Peso"
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={ajuste?.peso ?? ''}
                          onChange={(evento) =>
                            atualizarAjusteTemplate(template.etapa.id, {
                              peso: evento.currentTarget.value,
                            })
                          }
                        />
                        <Input
                          label="Ordem"
                          type="number"
                          min="0"
                          value={ajuste?.ordem ?? ''}
                          onChange={(evento) =>
                            atualizarAjusteTemplate(template.etapa.id, {
                              ordem: evento.currentTarget.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    {ajuste?.selecionado && (
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {template.subetapas.map((subetapa) => {
                          const ajusteSubetapa = ajuste.subetapas[subetapa.id]
                          return (
                            <label
                              key={subetapa.id}
                              className="flex items-center justify-between gap-3 rounded-lg bg-fundo px-3 py-2 text-sm"
                            >
                              <span className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={ajusteSubetapa?.selecionado ?? false}
                                  onChange={(evento) =>
                                    atualizarAjusteSubetapa(template.etapa.id, subetapa.id, {
                                      selecionado: evento.currentTarget.checked,
                                    })
                                  }
                                />
                                {subetapa.nome}
                              </span>
                              <span className="text-xs text-texto-suave">
                                peso {ajusteSubetapa?.peso ?? subetapa.peso_sugerido}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {passo === 3 && (
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr]">
              <div className="rounded-lg border border-borda px-4 py-3">
                <p className="rotulo-editorial">Obra</p>
                <h2 className="mt-1 text-lg font-semibold">{dados.nome || 'Sem nome'}</h2>
                <p className="mt-1 text-sm text-texto-suave">
                  {pavimentosValidos.length} pavimentos
                </p>
              </div>
              <div className="rounded-lg border border-borda px-4 py-3">
                <p className="rotulo-editorial">Etapas</p>
                <h2 className="mt-1 text-lg font-semibold">
                  {resumoPlanejado.totalEtapas}
                </h2>
                <p className="mt-1 text-sm text-texto-suave">
                  replicadas por pavimento
                </p>
              </div>
              <div className="rounded-lg border border-borda px-4 py-3">
                <p className="rotulo-editorial">Subetapas</p>
                <h2 className="mt-1 text-lg font-semibold">
                  {resumoPlanejado.totalSubetapas}
                </h2>
                <p className="mt-1 text-sm text-texto-suave">
                  prontas para progresso
                </p>
              </div>
              <div className="md:col-span-3">
                <EmptyState
                  icone={<IconeObra className="h-10 w-10" />}
                  titulo="Pronto para criar"
                  descricao="A obra será criada com os pavimentos e o template selecionado. Depois você pode editar pesos, ordem, dependências e progresso."
                />
              </div>
            </div>
          )}

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {erro}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-borda pt-4 sm:flex-row sm:justify-between">
            <Button
              variante="secundario"
              onClick={passo === 0 ? () => navegar('/app/obras') : voltar}
            >
              {passo === 0 ? 'Cancelar' : 'Voltar'}
            </Button>
            {passo < 3 ? (
              <Button onClick={avancar}>Continuar</Button>
            ) : (
              <Button carregando={criarObraMutation.isPending} onClick={() => void salvar()}>
                Criar obra
              </Button>
            )}
          </div>
        </CardConteudo>
      </Card>
    </div>
  )
}
