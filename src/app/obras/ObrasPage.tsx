import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/shared/auth/AuthProvider'
import {
  Card,
  CardConteudo,
  EmptyState,
  ProgressBar,
  Spinner,
} from '@/shared/components'
import { IconeMais, IconeObra } from '@/shared/components/icones'
import { formatarData, formatarMetragem } from '@/shared/lib/formatacao'
import { cn } from '@/shared/lib/cn'
import type { StatusObra } from '@/shared/types/database'
import { listarObrasResumo, type ObraResumo } from './obrasApi'

const filtros: Array<{ id: 'todas' | StatusObra; rotulo: string }> = [
  { id: 'todas', rotulo: 'Todas' },
  { id: 'ativa', rotulo: 'Ativas' },
  { id: 'pausada', rotulo: 'Pausadas' },
  { id: 'arquivada', rotulo: 'Arquivadas' },
]

const statusRotulo: Record<StatusObra, string> = {
  ativa: 'Ativa',
  pausada: 'Pausada',
  arquivada: 'Arquivada',
}

function ObraCard({ obra }: { obra: ObraResumo }) {
  return (
    <Link
      to={`/app/obras/${obra.id}`}
      className="group block rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-destaque"
    >
      <Card className="h-full overflow-hidden transition-transform group-hover:-translate-y-0.5">
        {obra.capa_url ? (
          <img
            src={obra.capa_url}
            alt=""
            className="h-36 w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-36 items-center justify-center bg-primaria/5 text-texto-suave">
            <IconeObra className="h-12 w-12" />
          </div>
        )}
        <CardConteudo className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{obra.nome}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-texto-suave">
                {obra.endereco || 'Endereço não informado'}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                obra.status === 'ativa' && 'bg-destaque/10 text-destaque',
                obra.status === 'pausada' && 'bg-amber-100 text-amber-800',
                obra.status === 'arquivada' && 'bg-borda text-texto-suave',
              )}
            >
              {statusRotulo[obra.status]}
            </span>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-texto-suave">Progresso</span>
              <span className="font-semibold">{Math.round(obra.progresso)}%</span>
            </div>
            <ProgressBar valor={obra.progresso} altura="sm" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="rotulo-editorial">Estrutura</p>
              <p className="mt-1 font-semibold">
                {obra.totalEtapas} etapas
                <span className="font-normal text-texto-suave">
                  {' '}
                  / {obra.totalSubetapas} subetapas
                </span>
              </p>
            </div>
            <div>
              <p className="rotulo-editorial">Metragem</p>
              <p className="mt-1 font-semibold">
                {obra.metragem_m2 ? formatarMetragem(obra.metragem_m2) : '-'}
              </p>
            </div>
          </div>

          {obra.etapaAtual && (
            <p className="rounded-lg bg-destaque/10 px-3 py-2 text-sm font-medium text-destaque">
              Instalando agora: {obra.etapaAtual}
            </p>
          )}

          {obra.previsao_entrega && (
            <p className="text-sm text-texto-suave">
              Previsão de entrega: {formatarData(obra.previsao_entrega)}
            </p>
          )}
        </CardConteudo>
      </Card>
    </Link>
  )
}

export function ObrasPage() {
  const { perfil } = useAuth()
  const [filtro, setFiltro] = useState<'todas' | StatusObra>('ativa')
  const { data, isLoading, isError } = useQuery({
    queryKey: ['obras', 'resumo'],
    queryFn: listarObrasResumo,
  })

  const obras = data ?? []
  const obrasFiltradas = useMemo(
    () => obras.filter((obra) => filtro === 'todas' || obra.status === filtro),
    [obras, filtro],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="rotulo-editorial">Obras</p>
          <h1 className="mt-1 text-2xl">Carteira de obras</h1>
          <p className="mt-2 max-w-2xl text-sm text-texto-suave">
            Cadastre, acompanhe e atualize a estrutura das obras ativas.
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

      <div className="flex gap-1 overflow-x-auto border-b border-borda">
        {filtros.map((item) => {
          const ativo = item.id === filtro
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltro(item.id)}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold',
                ativo
                  ? 'border-destaque text-texto'
                  : 'border-transparent text-texto-suave hover:text-texto',
              )}
            >
              {item.rotulo}
            </button>
          )
        })}
      </div>

      {isLoading && (
        <div className="flex min-h-56 items-center justify-center">
          <Spinner />
        </div>
      )}

      {isError && (
        <EmptyState
          titulo="Não foi possível carregar as obras"
          descricao="Verifique sua conexão e tente novamente."
        />
      )}

      {!isLoading && !isError && obrasFiltradas.length === 0 && (
        <EmptyState
          icone={<IconeObra className="h-10 w-10" />}
          titulo={obras.length === 0 ? 'Nenhuma obra cadastrada' : 'Nada neste filtro'}
          descricao={
            obras.length === 0
              ? 'Crie a primeira obra para iniciar a estrutura de acompanhamento.'
              : 'Altere o filtro para ver outras obras.'
          }
          acao={
            perfil?.papel === 'admin' ? (
              <Link
                to="/app/obras/nova"
                className="inline-flex h-10 items-center justify-center rounded-full bg-primaria px-4 text-sm font-semibold text-white"
              >
                Criar obra
              </Link>
            ) : undefined
          }
        />
      )}

      {obrasFiltradas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {obrasFiltradas.map((obra) => (
            <ObraCard key={obra.id} obra={obra} />
          ))}
        </div>
      )}
    </div>
  )
}
