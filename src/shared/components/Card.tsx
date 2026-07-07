import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-card border border-borda bg-superficie shadow-card',
        className,
      )}
      {...props}
    />
  )
}

interface CardCabecalhoProps {
  titulo: ReactNode
  descricao?: ReactNode
  acoes?: ReactNode
  className?: string
}

export function CardCabecalho({
  titulo,
  descricao,
  acoes,
  className,
}: CardCabecalhoProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border-b border-borda px-5 py-4',
        className,
      )}
    >
      <div>
        <h3 className="text-base font-semibold">{titulo}</h3>
        {descricao && (
          <p className="mt-0.5 text-sm text-texto-suave">{descricao}</p>
        )}
      </div>
      {acoes}
    </div>
  )
}

export function CardConteudo({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />
}
