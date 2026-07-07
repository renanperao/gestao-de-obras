import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/shared/lib/cn'

const estiloCampo =
  'w-full rounded-lg border border-borda bg-superficie px-3.5 text-texto placeholder:text-texto-suave/70 transition-colors focus:border-texto-suave focus:outline-none disabled:cursor-not-allowed disabled:opacity-60'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  erro?: string
  dica?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, erro, dica, className, id, ...props },
  ref,
) {
  const idGerado = useId()
  const idCampo = id ?? idGerado
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={idCampo} className="rotulo-editorial block">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={idCampo}
        aria-invalid={erro ? true : undefined}
        className={cn(
          estiloCampo,
          'h-11',
          erro && 'border-red-500 focus:border-red-500',
          className,
        )}
        {...props}
      />
      {erro ? (
        <p className="text-sm text-red-600" role="alert">
          {erro}
        </p>
      ) : (
        dica && <p className="text-sm text-texto-suave">{dica}</p>
      )}
    </div>
  )
})

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  erro?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, erro, className, id, rows = 4, ...props }, ref) {
    const idGerado = useId()
    const idCampo = id ?? idGerado
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={idCampo} className="rotulo-editorial block">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={idCampo}
          rows={rows}
          aria-invalid={erro ? true : undefined}
          className={cn(
            estiloCampo,
            'py-2.5',
            erro && 'border-red-500 focus:border-red-500',
            className,
          )}
          {...props}
        />
        {erro && (
          <p className="text-sm text-red-600" role="alert">
            {erro}
          </p>
        )}
      </div>
    )
  },
)
