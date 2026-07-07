import { cn } from '@/shared/lib/cn'
import { limitarPercentual } from '@/shared/lib/progresso'

const alturas = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

interface ProgressBarProps {
  valor: number
  altura?: keyof typeof alturas
  mostrarRotulo?: boolean
  className?: string
}

export function ProgressBar({
  valor,
  altura = 'md',
  mostrarRotulo = false,
  className,
}: ProgressBarProps) {
  const v = limitarPercentual(valor)
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-valuenow={Math.round(v)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          'flex-1 overflow-hidden rounded-full bg-borda',
          alturas[altura],
        )}
      >
        <div
          className="h-full rounded-full bg-destaque transition-[width] duration-500"
          style={{ width: `${v}%` }}
        />
      </div>
      {mostrarRotulo && (
        <span className="min-w-[3ch] text-sm font-semibold tabular-nums">
          {Math.round(v)}%
        </span>
      )}
    </div>
  )
}
