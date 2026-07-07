import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import { Spinner } from './Spinner'

const variantes = {
  primario:
    'bg-primaria text-white hover:opacity-90 disabled:hover:opacity-100',
  destaque:
    'bg-destaque text-white hover:opacity-90 disabled:hover:opacity-100',
  secundario:
    'bg-superficie text-texto border border-borda hover:border-texto-suave',
  fantasma: 'bg-transparent text-texto hover:bg-primaria/5',
  perigo: 'bg-red-600 text-white hover:bg-red-700',
}

const tamanhos = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: keyof typeof variantes
  tamanho?: keyof typeof tamanhos
  carregando?: boolean
  larguraTotal?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variante = 'primario',
      tamanho = 'md',
      carregando = false,
      larguraTotal = false,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || carregando}
        className={cn(
          'inline-flex select-none items-center justify-center rounded-full font-semibold transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-60',
          variantes[variante],
          tamanhos[tamanho],
          larguraTotal && 'w-full',
          className,
        )}
        {...props}
      >
        {carregando && <Spinner tamanho="sm" className="text-current" />}
        {children}
      </button>
    )
  },
)
