import { EmptyState } from '@/shared/components'

/** Placeholder das seções que chegam nas próximas fases do plano. */
export function PaginaEmBreve({
  titulo,
  fase,
}: {
  titulo: string
  fase: string
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="rotulo-editorial">{titulo}</p>
        <h1 className="mt-1 text-2xl">{titulo}</h1>
      </div>
      <EmptyState
        titulo="Em construção"
        descricao={`Esta seção será implementada na ${fase} do plano de desenvolvimento.`}
      />
    </div>
  )
}
