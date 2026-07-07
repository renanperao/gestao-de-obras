import { cn } from '@/shared/lib/cn'

const tamanhos = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

interface SpinnerProps {
  tamanho?: keyof typeof tamanhos
  className?: string
}

export function Spinner({ tamanho = 'md', className }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin text-destaque', tamanhos[tamanho], className)}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Carregando"
    >
      <circle
        className="opacity-20"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TelaCarregando() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-fundo">
      <Spinner tamanho="lg" />
    </div>
  )
}
