import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from './AuthProvider'
import { rotaInicialDoPapel } from './guardas'
import { CartaoAuth } from './CartaoAuth'
import { FormularioNovaSenha } from './FormularioNovaSenha'
import { TelaCarregando, useToast } from '@/shared/components'

/**
 * Primeiro acesso: o usuário entrou com a senha provisória e é obrigado
 * a definir a própria senha antes de liberar o painel/portal (plano §5.4).
 */
export function PrimeiroAcessoPage() {
  const { sessao, perfil, carregando, recarregarPerfil } = useAuth()
  const { exibirToast } = useToast()
  const navegar = useNavigate()

  if (carregando) return <TelaCarregando />
  if (!sessao) return <Navigate to="/entrar" replace />
  if (perfil && !perfil.primeiro_acesso) {
    return <Navigate to={rotaInicialDoPapel(perfil.papel)} replace />
  }

  const salvar = async (senha: string) => {
    const { error } = await supabase.auth.updateUser({ password: senha })
    if (error) throw error

    const { error: erroPerfil } = await supabase
      .from('perfis')
      .update({ primeiro_acesso: false })
      .eq('id', sessao.user.id)
    if (erroPerfil) throw erroPerfil

    await recarregarPerfil()
    exibirToast('sucesso', 'Senha definida. Bem-vindo!')
    navegar('/', { replace: true })
  }

  return (
    <CartaoAuth
      titulo={`Olá, ${perfil?.nome ?? ''}`.trim()}
      descricao="Antes de continuar, defina uma senha pessoal para substituir a provisória."
    >
      <FormularioNovaSenha rotuloBotao="Definir senha e continuar" aoSalvar={salvar} />
    </CartaoAuth>
  )
}
