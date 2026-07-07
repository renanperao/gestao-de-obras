import { useAuth } from '@/shared/auth/AuthProvider'
import { EmptyState } from '@/shared/components'
import { IconeObra } from '@/shared/components/icones'

export function DashboardPage() {
  const { perfil } = useAuth()
  const primeiroNome = perfil?.nome.split(' ')[0] ?? ''

  return (
    <div className="space-y-6">
      <div>
        <p className="rotulo-editorial">Painel</p>
        <h1 className="mt-1 text-2xl">Olá, {primeiroNome}</h1>
      </div>
      <EmptyState
        icone={<IconeObra className="h-10 w-10" />}
        titulo="Nenhuma obra ainda"
        descricao="Os cards das obras ativas, contas da semana e próximos compromissos aparecerão aqui. O cadastro de obras chega na Fase 1."
      />
    </div>
  )
}
