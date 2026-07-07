import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface EmptyStateProps {
  titulo: string
  descricao?: string
  icone?: ReactNode
  acao?: ReactNode
  className?: string
}

export function EmptyState({
  titulo,
  descricao,
  icone,
  acao,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-card border border-dashed border-borda bg-superficie/60 px-6 py-12 text-center',
        className,
      )}
    >
      {icone && <div className="mb-3 text-texto-suave/60">{icone}</div>}
      <h3 className="text-base font-semibold">{titulo}</h3>
      {descricao && (
        <p className="mt-1 max-w-sm text-sm text-texto-suave">{descricao}</p>
      )}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}
