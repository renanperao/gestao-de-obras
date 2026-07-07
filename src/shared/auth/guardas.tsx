import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { TelaCarregando } from '@/shared/components'
import { Button } from '@/shared/components'
import type { Papel } from '@/shared/types/database'

export function rotaInicialDoPapel(papel: Papel): string {
  return papel === 'cliente' ? '/portal' : '/app'
}

function ErroDePerfil() {
  const { sair } = useAuth()
  return (
    <div className="flex min-h-dvh items-center justify-center bg-fundo px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold">Perfil não encontrado</h1>
        <p className="mt-2 text-sm text-texto-suave">
          Sua conta existe, mas o perfil não pôde ser carregado. Fale com o
          escritório para regularizar o acesso.
        </p>
        <Button className="mt-5" variante="secundario" onClick={() => void sair()}>
          Sair e tentar novamente
        </Button>
      </div>
    </div>
  )
}

/**
 * Protege uma rota por papel. Redireciona para /entrar sem sessão,
 * força o fluxo de primeiro acesso e manda cada papel para sua janela.
 */
export function RotaProtegida({
  papeis,
  children,
}: {
  papeis: Papel[]
  children: ReactNode
}) {
  const { sessao, perfil, carregando, erroPerfil } = useAuth()
  const localizacao = useLocation()

  if (carregando) return <TelaCarregando />

  if (!sessao) {
    return <Navigate to="/entrar" state={{ de: localizacao.pathname }} replace />
  }

  if (erroPerfil) return <ErroDePerfil />
  if (!perfil) return <TelaCarregando />

  if (perfil.primeiro_acesso) {
    return <Navigate to="/primeiro-acesso" replace />
  }

  if (!papeis.includes(perfil.papel)) {
    return <Navigate to={rotaInicialDoPapel(perfil.papel)} replace />
  }

  return <>{children}</>
}

/** Rota raiz: decide a janela conforme o papel. */
export function RedirecionarPorPapel() {
  const { sessao, perfil, carregando, erroPerfil } = useAuth()

  if (carregando) return <TelaCarregando />
  if (!sessao) return <Navigate to="/entrar" replace />
  if (erroPerfil) return <ErroDePerfil />
  if (!perfil) return <TelaCarregando />
  if (perfil.primeiro_acesso) return <Navigate to="/primeiro-acesso" replace />

  return <Navigate to={rotaInicialDoPapel(perfil.papel)} replace />
}
