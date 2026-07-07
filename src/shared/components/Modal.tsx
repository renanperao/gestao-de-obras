import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

interface ModalProps {
  aberto: boolean
  aoFechar: () => void
  titulo?: ReactNode
  children: ReactNode
  rodape?: ReactNode
  larguraMax?: string
}

export function Modal({
  aberto,
  aoFechar,
  titulo,
  children,
  rodape,
  larguraMax = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', aoTeclar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = ''
    }
  }, [aberto, aoFechar])

  if (!aberto) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-primaria/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={aoFechar}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        onMouseDown={(evento) => evento.stopPropagation()}
        className={cn(
          'w-full rounded-t-2xl bg-superficie shadow-card sm:rounded-card',
          'max-h-[92dvh] overflow-y-auto',
          larguraMax,
        )}
      >
        {titulo && (
          <div className="flex items-center justify-between border-b border-borda px-5 py-4">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="-mr-1 rounded-full p-1.5 text-texto-suave hover:bg-primaria/5 hover:text-texto"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {rodape && (
          <div className="flex justify-end gap-2 border-t border-borda px-5 py-4">
            {rodape}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
