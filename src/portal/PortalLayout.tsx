import { Outlet } from 'react-router-dom'
import { useAuth } from '@/shared/auth/AuthProvider'
import { useConfiguracaoEscritorio } from '@/shared/hooks/useConfiguracaoEscritorio'
import { IconeSair } from '@/shared/components/icones'

/**
 * Janela do CLIENTE — 100% leitura, com a identidade do escritório.
 * Navegação por seções (Progresso, Fotos, Avisos, Financeiro) entra na Fase 3.
 */
export function PortalLayout() {
  const { sair } = useAuth()
  const { data: config } = useConfiguracaoEscritorio()
  const nomeEscritorio = config?.nome_escritorio ?? 'Portal da Obra'

  return (
    <div className="flex min-h-dvh flex-col bg-fundo">
      <header className="sticky top-0 z-20 border-b border-borda bg-superficie/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            {config?.logo_url && (
              <img
                src={config.logo_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            )}
            <div>
              <p className="rotulo-editorial">{nomeEscritorio}</p>
              {config?.slogan && (
                <p className="text-xs text-texto-suave">{config.slogan}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void sair()}
            title="Sair"
            className="rounded-lg p-1.5 text-texto-suave hover:text-texto"
          >
            <IconeSair className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-borda py-5 text-center">
        <p className="text-xs text-texto-suave">
          {nomeEscritorio} — acompanhamento de obra
        </p>
      </footer>
    </div>
  )
}
