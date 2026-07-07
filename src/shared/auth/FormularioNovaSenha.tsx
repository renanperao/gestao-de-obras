import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input } from '@/shared/components'

const esquema = z
  .object({
    senha: z.string().min(8, 'Use ao menos 8 caracteres'),
    confirmacao: z.string(),
  })
  .refine((campos) => campos.senha === campos.confirmacao, {
    message: 'As senhas não conferem',
    path: ['confirmacao'],
  })

type Campos = z.infer<typeof esquema>

export function FormularioNovaSenha({
  rotuloBotao,
  aoSalvar,
}: {
  rotuloBotao: string
  aoSalvar: (senha: string) => Promise<void>
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Campos>({ resolver: zodResolver(esquema) })

  const salvar = handleSubmit(async ({ senha }) => {
    try {
      await aoSalvar(senha)
    } catch {
      setError('root', {
        message: 'Não foi possível salvar a senha. Tente novamente.',
      })
    }
  })

  return (
    <form onSubmit={salvar} className="space-y-4" noValidate>
      <Input
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        erro={errors.senha?.message}
        {...register('senha')}
      />
      <Input
        label="Confirmar senha"
        type="password"
        autoComplete="new-password"
        erro={errors.confirmacao?.message}
        {...register('confirmacao')}
      />
      {errors.root && (
        <p className="text-sm text-red-600" role="alert">
          {errors.root.message}
        </p>
      )}
      <Button type="submit" larguraTotal carregando={isSubmitting}>
        {rotuloBotao}
      </Button>
    </form>
  )
}
