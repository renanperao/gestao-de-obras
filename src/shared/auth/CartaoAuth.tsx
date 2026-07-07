import type { ReactNode } from 'react'

/** Moldura das telas de autenticação (login, recuperação, primeiro acesso). */
export function CartaoAuth({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao?: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-fundo px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="rotulo-editorial mb-8 text-center">Gestão de Obras</p>
        <div className="rounded-card border border-borda bg-superficie p-6 shadow-card sm:p-8">
          <h1 className="text-xl">{titulo}</h1>
          {descricao && (
            <p className="mt-1.5 text-sm text-texto-suave">{descricao}</p>
          )}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
