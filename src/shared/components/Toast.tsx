import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/shared/lib/cn'

type TipoToast = 'sucesso' | 'erro' | 'info'

interface Toast {
  id: number
  tipo: TipoToast
  mensagem: string
}

interface ContextoToast {
  exibirToast: (tipo: TipoToast, mensagem: string) => void
}

const ToastContext = createContext<ContextoToast | null>(null)

export function useToast(): ContextoToast {
  const contexto = useContext(ToastContext)
  if (!contexto) {
    throw new Error('useToast deve ser usado dentro de <ToastProvider>')
  }
  return contexto
}

const estilos: Record<TipoToast, string> = {
  sucesso: 'bg-primaria text-white',
  erro: 'bg-red-600 text-white',
  info: 'bg-superficie text-texto border border-borda',
}

const icones: Record<TipoToast, ReactNode> = {
  sucesso: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  erro: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
      <path
        d="M12 8v5m0 3.5v.5M4.5 19h15L12 5.5 4.5 19z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 11v5m0-8.5v.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
}

let proximoId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const exibirToast = useCallback((tipo: TipoToast, mensagem: string) => {
    const id = proximoId++
    setToasts((atuais) => [...atuais, { id, tipo, mensagem }])
    setTimeout(() => {
      setToasts((atuais) => atuais.filter((toast) => toast.id !== id))
    }, 4500)
  }, [])

  const valor = useMemo(() => ({ exibirToast }), [exibirToast])

  return (
    <ToastContext.Provider value={valor}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-6"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-full px-4 py-3 text-sm font-medium shadow-card',
                estilos[toast.tipo],
              )}
            >
              {icones[toast.tipo]}
              <span>{toast.mensagem}</span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}
