import { useAuth } from '@/shared/auth/AuthProvider'
import { EmptyState } from '@/shared/components'
import { IconeProgresso } from '@/shared/components/icones'

export function PortalHomePage() {
  const { perfil } = useAuth()
  const primeiroNome = perfil?.nome.split(' ')[0] ?? ''

  return (
    <div className="space-y-6">
      <div>
        <p className="rotulo-editorial">Sua obra</p>
        <h1 className="mt-1 text-2xl">Olá, {primeiroNome}</h1>
      </div>
      <EmptyState
        icone={<IconeProgresso className="h-10 w-10" />}
        titulo="Acompanhamento em preparação"
        descricao="Assim que o escritório vincular sua obra, você verá aqui o progresso por etapa, as fotos do canteiro, avisos e a agenda."
      />
    </div>
  )
}
