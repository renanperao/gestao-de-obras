import { cn } from '@/shared/lib/cn'

export interface Aba {
  id: string
  rotulo: string
  contador?: number
}

interface TabsProps {
  abas: Aba[]
  ativa: string
  aoMudar: (id: string) => void
  className?: string
}

export function Tabs({ abas, ativa, aoMudar, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto border-b border-borda',
        className,
      )}
    >
      {abas.map((aba) => {
        const estaAtiva = aba.id === ativa
        return (
          <button
            key={aba.id}
            role="tab"
            type="button"
            aria-selected={estaAtiva}
            onClick={() => aoMudar(aba.id)}
            className={cn(
              'whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              estaAtiva
                ? 'border-destaque text-texto'
                : 'border-transparent text-texto-suave hover:text-texto',
            )}
          >
            {aba.rotulo}
            {aba.contador !== undefined && (
              <span
                className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-xs tabular-nums',
                  estaAtiva
                    ? 'bg-destaque/10 text-destaque'
                    : 'bg-borda text-texto-suave',
                )}
              >
                {aba.contador}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
