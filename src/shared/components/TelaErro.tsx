import { useState, type ReactNode } from 'react'

interface TelaErroProps {
  titulo: string
  descricao: string
  /** Texto técnico (mensagem, stack) mostrado num bloco recolhível e copiável. */
  detalhes?: string
  aoRecarregar?: () => void
  acaoExtra?: ReactNode
}

/**
 * Tela de falha genérica — usada tanto pelo ErrorBoundary quanto pela detecção
 * de configuração ausente no boot. É deliberadamente autossuficiente (apenas
 * React + classes utilitárias) para renderizar mesmo quando o resto do app
 * está quebrado.
 */
export function TelaErro({
  titulo,
  descricao,
  detalhes,
  aoRecarregar,
  acaoExtra,
}: TelaErroProps) {
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    if (!detalhes) return
    try {
      await navigator.clipboard.writeText(detalhes)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Clipboard pode estar indisponível (ex.: contexto sem HTTPS). Ignora.
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-fundo px-4 py-10 font-sans text-texto">
      <div className="w-full max-w-md overflow-hidden rounded-card border border-borda bg-superficie shadow-card">
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
          </span>

          <h1 className="text-lg font-semibold tracking-tight">{titulo}</h1>
          <p className="mt-2 text-sm leading-relaxed text-texto-suave">
            {descricao}
          </p>

          <div className="mt-6 flex w-full flex-col gap-2">
            {aoRecarregar && (
              <button
                type="button"
                onClick={aoRecarregar}
                className="inline-flex h-11 w-full select-none items-center justify-center rounded-full bg-primaria px-5 text-sm font-semibold text-white transition-colors hover:opacity-90"
              >
                Recarregar página
              </button>
            )}
            {acaoExtra}
          </div>
        </div>

        {detalhes && (
          <details className="border-t border-borda px-6 py-4 text-left">
            <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-[0.14em] text-texto-suave">
              Detalhes técnicos
            </summary>
            <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-fundo p-3 text-xs leading-relaxed text-texto-suave">
              {detalhes}
            </pre>
            <button
              type="button"
              onClick={copiar}
              className="mt-2 inline-flex h-9 select-none items-center justify-center rounded-full border border-borda bg-superficie px-3 text-xs font-semibold text-texto transition-colors hover:border-texto-suave"
            >
              {copiado ? 'Copiado!' : 'Copiar detalhes'}
            </button>
          </details>
        )}
      </div>
    </div>
  )
}
