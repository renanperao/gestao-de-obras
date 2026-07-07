import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase'
import type { Perfil } from '@/shared/types/database'

interface ContextoAuth {
  sessao: Session | null
  perfil: Perfil | null
  carregando: boolean
  erroPerfil: boolean
  recarregarPerfil: () => Promise<void>
  sair: () => Promise<void>
}

const AuthContext = createContext<ContextoAuth | null>(null)

export function useAuth(): ContextoAuth {
  const contexto = useContext(AuthContext)
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  }
  return contexto
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erroPerfil, setErroPerfil] = useState(false)

  const carregarPerfil = useCallback(async (usuarioId: string) => {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .eq('id', usuarioId)
      .single()
    if (error) {
      setPerfil(null)
      setErroPerfil(true)
    } else {
      setPerfil(data)
      setErroPerfil(false)
    }
  }, [])

  useEffect(() => {
    let ativo = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!ativo) return
      setSessao(session)
      if (session) await carregarPerfil(session.user.id)
      if (ativo) setCarregando(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, session) => {
      setSessao(session)
      if (session) {
        // deferido: chamadas ao supabase dentro do callback podem travar
        setTimeout(() => {
          if (ativo) void carregarPerfil(session.user.id)
        }, 0)
      } else {
        setPerfil(null)
        setErroPerfil(false)
      }
    })

    return () => {
      ativo = false
      subscription.unsubscribe()
    }
  }, [carregarPerfil])

  const recarregarPerfil = useCallback(async () => {
    if (sessao) await carregarPerfil(sessao.user.id)
  }, [sessao, carregarPerfil])

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const valor = useMemo(
    () => ({ sessao, perfil, carregando, erroPerfil, recarregarPerfil, sair }),
    [sessao, perfil, carregando, erroPerfil, recarregarPerfil, sair],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
