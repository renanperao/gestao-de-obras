import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth/AuthProvider'
import { Card, CardConteudo, EmptyState, ProgressBar, Spinner } from '@/shared/components'
import { IconeMais, IconeObra } from '@/shared/components/icones'
import { formatarData } from '@/shared/lib/formatacao'
import { listarObrasResumo } from './obras/obrasApi'

export function DashboardPage() {
  const { perfil } = useAuth()
  const primeiroNome = perfil?.nome.split(' ')[0] ?? ''
  const { data, isLoading, isError } = useQuery({
    queryKey: ['obras', 'resumo'],
    queryFn: listarObrasResumo,
  })

  const obrasAtivas = (data ?? []).filter((obra) => obra.status === 'ativa')
  const obrasEmDestaque = obrasAtivas.slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="rotulo-editorial">Painel</p>
          <h1 className="mt-1 text-2xl">Olá, {primeiroNome}</h1>
          <p className="mt-2 text-sm text-texto-suave">
            Obras ativas, frentes em andamento e próximos passos.
          </p>
        </div>
        {perfil?.papel === 'admin' && (
          <Link
            to="/app/obras/nova"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primaria px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <IconeMais className="h-5 w-5" />
            Nova obra
          </Link>
        )}
      </div>

      {isLoading && (
        <div className="flex min-h-56 items-center justify-center">
          <Spinner />
        </div>
      )}

      {isError && (
        <EmptyState
          titulo="Não foi possível carregar o painel"
          descricao="Confira sua conexão e tente novamente."
        />
      )}

      {!isLoading && !isError && obrasEmDestaque.length === 0 && (
        <EmptyState
          icone={<IconeObra className="h-10 w-10" />}
          titulo="Nenhuma obra ativa"
          descricao="As obras criadas aparecem aqui com progresso, frente atual e previsão de entrega."
          acao={
            perfil?.papel === 'admin' ? (
              <Link
                to="/app/obras/nova"
                className="inline-flex h-10 items-center justify-center rounded-full bg-primaria px-4 text-sm font-semibold text-white"
              >
                Criar primeira obra
              </Link>
            ) : undefined
          }
        />
      )}

      {obrasEmDestaque.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {obrasEmDestaque.map((obra) => (
            <Link key={obra.id} to={`/app/obras/${obra.id}`} className="block">
              <Card className="transition-transform hover:-translate-y-0.5">
                <CardConteudo className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold">{obra.nome}</h2>
                      <p className="mt-1 text-sm text-texto-suave">
                        {obra.etapaAtual
                          ? `Instalando agora: ${obra.etapaAtual}`
                          : 'Sem frente ativa marcada'}
                      </p>
                    </div>
                    <span className="rounded-full bg-destaque/10 px-2.5 py-1 text-xs font-semibold text-destaque">
                      {Math.round(obra.progresso)}%
                    </span>
                  </div>
                  <ProgressBar valor={obra.progresso} />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="rotulo-editorial">Estrutura</p>
                      <p className="mt-1 font-semibold">{obra.totalEtapas} etapas</p>
                    </div>
                    <div>
                      <p className="rotulo-editorial">Entrega</p>
                      <p className="mt-1 font-semibold">
                        {obra.previsao_entrega
                          ? formatarData(obra.previsao_entrega)
                          : 'Sem data'}
                      </p>
                    </div>
                  </div>
                </CardConteudo>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
