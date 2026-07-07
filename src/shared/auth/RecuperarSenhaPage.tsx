import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/shared/lib/supabase'
import { Button, Input } from '@/shared/components'
import { CartaoAuth } from './CartaoAuth'

const esquema = z.object({
  email: z.string().email('Informe um e-mail válido'),
})

type Campos = z.infer<typeof esquema>

export function RecuperarSenhaPage() {
  const [enviado, setEnviado] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Campos>({ resolver: zodResolver(esquema) })

  const enviar = handleSubmit(async ({ email }) => {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    // resposta neutra: não revela se o e-mail existe
    setEnviado(true)
  })

  return (
    <CartaoAuth
      titulo="Recuperar senha"
      descricao="Informe seu e-mail e enviaremos um link para redefinir a senha."
    >
      {enviado ? (
        <p className="text-sm">
          Se o e-mail estiver cadastrado, você receberá um link de redefinição
          em instantes. Confira também a caixa de spam.
        </p>
      ) : (
        <form onSubmit={enviar} className="space-y-4" noValidate>
          <Input
            label="E-mail"
            type="email"
            autoComplete="email"
            inputMode="email"
            erro={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" larguraTotal carregando={isSubmitting}>
            Enviar link
          </Button>
        </form>
      )}
      <p className="mt-5 text-center text-sm">
        <Link
          to="/entrar"
          className="font-medium text-texto-suave underline-offset-4 hover:text-texto hover:underline"
        >
          Voltar para o login
        </Link>
      </p>
    </CartaoAuth>
  )
}
