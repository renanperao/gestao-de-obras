import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from './AuthProvider'
import { CartaoAuth } from './CartaoAuth'
import { FormularioNovaSenha } from './FormularioNovaSenha'
import { TelaCarregando, useToast } from '@/shared/components'

/**
 * Destino do link de recuperação enviado por e-mail. O Supabase autentica
 * pela URL (detectSessionInUrl) e então o usuário define a nova senha.
 */
export function RedefinirSenhaPage() {
  const { sessao, carregando } = useAuth()
  const { exibirToast } = useToast()
  const navegar = useNavigate()
  const [aguardandoLink, setAguardandoLink] = useState(true)

  // pequena tolerância para o token do hash virar sessão
  useEffect(() => {
    const temporizador = setTimeout(() => setAguardandoLink(false), 1500)
    return () => clearTimeout(temporizador)
  }, [])

  if (carregando || (aguardandoLink && !sessao)) return <TelaCarregando />

  if (!sessao) {
    return (
      <CartaoAuth
        titulo="Link inválido ou expirado"
        descricao="Solicite um novo link de redefinição de senha."
      >
        <p className="text-center text-sm">
          <Link
            to="/recuperar-senha"
            className="font-medium underline underline-offset-4"
          >
            Pedir novo link
          </Link>
        </p>
      </CartaoAuth>
    )
  }

  const salvar = async (senha: string) => {
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) throw error

    // quem redefiniu a senha já não depende da provisória
    await supabase
      .from('perfis')
      .update({ primeiro_acesso: false })
      .eq('id', sessao.user.id)

    exibirToast('sucesso', 'Senha atualizada.')
    navegar('/', { replace: true })
  }

  return (
    <CartaoAuth
      titulo="Nova senha"
      descricao="Defina a nova senha da sua conta."
    >
      <FormularioNovaSenha rotuloBotao="Salvar nova senha" aoSalvar={salvar} />
    </CartaoAuth>
  )
}
