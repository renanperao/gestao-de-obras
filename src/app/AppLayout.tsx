import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/auth/AuthProvider'
import { useConfiguracaoEscritorio } from '@/shared/hooks/useConfiguracaoEscritorio'
import { cn } from '@/shared/lib/cn'
import {
  IconeConfiguracoes,
  IconeCompras,
  IconeFinanceiro,
  IconeObra,
  IconePainel,
  IconeRelatorios,
  IconeSair,
} from '@/shared/components/icones'

const navegacao = [
  { para: '/app', rotulo: 'Painel', Icone: IconePainel, fim: true },
  { para: '/app/obras', rotulo: 'Obras', Icone: IconeObra },
  { para: '/app/suprimentos', rotulo: 'Suprimentos', Icone: IconeCompras },
  { para: '/app/financeiro', rotulo: 'Financeiro', Icone: IconeFinanceiro },
  { para: '/app/relatorios', rotulo: 'Relatórios', Icone: IconeRelatorios },
  {
    para: '/app/configuracoes',
    rotulo: 'Configurações',
    Icone: IconeConfiguracoes,
  },
]

// mobile: no máximo 5 itens no bottom nav (Relatórios fica no desktop)
const navegacaoMobile = navegacao.filter(
  (item) => item.rotulo !== 'Relatórios',
)

export function AppLayout() {
  const { perfil, sair } = useAuth()
  const { data: config } = useConfiguracaoEscritorio()
  const nomeEscritorio = config?.nome_escritorio ?? 'Gestão de Obras'

  return (
    <div className="min-h-dvh bg-fundo">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-borda bg-superficie md:flex">
        <div className="px-5 py-6">
          <p className="rotulo-editorial">{nomeEscritorio}</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {navegacao.map(({ para, rotulo, Icone, fim }) => (
            <NavLink
              key={para}
              to={para}
              end={fim}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primaria text-white'
                    : 'text-texto-suave hover:bg-primaria/5 hover:text-texto',
                )
              }
            >
              <Icone className="h-5 w-5" />
              {rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-borda p-3">
          <div className="flex items-center justify-between gap-2 px-2 py-1.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{perfil?.nome}</p>
              <p className="text-xs capitalize text-texto-suave">
                {perfil?.papel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void sair()}
              title="Sair"
              className="rounded-lg p-2 text-texto-suave hover:bg-primaria/5 hover:text-texto"
            >
              <IconeSair className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Barra superior — mobile */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-borda bg-superficie/90 px-4 py-3 backdrop-blur md:hidden">
        <p className="rotulo-editorial">{nomeEscritorio}</p>
        <button
          type="button"
          onClick={() => void sair()}
          title="Sair"
          className="rounded-lg p-1.5 text-texto-suave hover:text-texto"
        >
          <IconeSair className="h-5 w-5" />
        </button>
      </header>

      <main className="px-4 pb-24 pt-5 md:ml-60 md:px-8 md:pb-10 md:pt-8">
        <Outlet />
      </main>

      {/* Bottom navigation — mobile (uso em canteiro, uma mão) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-superficie pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5">
          {navegacaoMobile.map(({ para, rotulo, Icone, fim }) => (
            <NavLink
              key={para}
              to={para}
              end={fim}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold',
                  isActive ? 'text-destaque' : 'text-texto-suave',
                )
              }
            >
              <Icone className="h-6 w-6" />
              {rotulo}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
