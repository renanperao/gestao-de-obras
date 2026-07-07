import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/shared/lib/supabase'
import { Button, Input } from '@/shared/components'
import { CartaoAuth } from './CartaoAuth'

const esquema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  senha: z.string().min(1, 'Informe sua senha'),
})

type Campos = z.infer<typeof esquema>

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.'
  }
  if (mensagem.includes('Email not confirmed')) {
    return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'
  }
  return 'Não foi possível entrar. Tente novamente em instantes.'
}

export function LoginPage() {
  const navegar = useNavigate()
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Campos>({ resolver: zodResolver(esquema) })

  const entrar = handleSubmit(async ({ email, senha }) => {
    setErroGeral(null)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    })
    if (error) {
      setErroGeral(traduzirErro(error.message))
      return
    }
    // a raiz decide a janela (/app ou /portal) conforme o papel
    navegar('/', { replace: true })
  })

  return (
    <CartaoAuth
      titulo="Acessar"
      descricao="Entre com o e-mail e a senha fornecidos pelo escritório."
    >
      <form onSubmit={entrar} className="space-y-4" noValidate>
        <Input
          label="E-mail"
          type="email"
          autoComplete="email"
          inputMode="email"
          erro={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Senha"
          type="password"
          autoComplete="current-password"
          erro={errors.senha?.message}
          {...register('senha')}
        />
        {erroGeral && (
          <p className="text-sm text-red-600" role="alert">
            {erroGeral}
          </p>
        )}
        <Button type="submit" larguraTotal carregando={isSubmitting}>
          Entrar
        </Button>
      </form>
      <p className="mt-5 text-center text-sm">
        <Link
          to="/recuperar-senha"
          className="font-medium text-texto-suave underline-offset-4 hover:text-texto hover:underline"
        >
          Esqueci minha senha
        </Link>
      </p>
    </CartaoAuth>
  )
}
