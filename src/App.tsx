import { Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/shared/auth/LoginPage'
import { RecuperarSenhaPage } from '@/shared/auth/RecuperarSenhaPage'
import { RedefinirSenhaPage } from '@/shared/auth/RedefinirSenhaPage'
import { PrimeiroAcessoPage } from '@/shared/auth/PrimeiroAcessoPage'
import { RedirecionarPorPapel, RotaProtegida } from '@/shared/auth/guardas'
import { AppLayout } from '@/app/AppLayout'
import { DashboardPage } from '@/app/DashboardPage'
import { PaginaEmBreve } from '@/app/PaginaEmBreve'
import { ObrasPage } from '@/app/obras/ObrasPage'
import { NovaObraPage } from '@/app/obras/NovaObraPage'
import { ObraDetalhePage } from '@/app/obras/ObraDetalhePage'
import { PortalLayout } from '@/portal/PortalLayout'
import { PortalHomePage } from '@/portal/PortalHomePage'
import { EmptyState } from '@/shared/components'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<RedirecionarPorPapel />} />

      {/* Autenticação */}
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
      <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
      <Route path="/primeiro-acesso" element={<PrimeiroAcessoPage />} />

      {/* Janela da EQUIPE */}
      <Route
        path="/app"
        element={
          <RotaProtegida papeis={['admin', 'equipe']}>
            <AppLayout />
          </RotaProtegida>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="obras" element={<ObrasPage />} />
        <Route path="obras/nova" element={<NovaObraPage />} />
        <Route path="obras/:obraId" element={<ObraDetalhePage />} />
        <Route
          path="suprimentos"
          element={<PaginaEmBreve titulo="Suprimentos" fase="Fase 4" />}
        />
        <Route
          path="financeiro"
          element={<PaginaEmBreve titulo="Financeiro" fase="Fase 5" />}
        />
        <Route
          path="relatorios"
          element={<PaginaEmBreve titulo="Relatórios" fase="Fase 7" />}
        />
        <Route
          path="configuracoes"
          element={<PaginaEmBreve titulo="Configurações" fase="Fase 3" />}
        />
      </Route>

      {/* Janela do CLIENTE (admin/equipe podem pré-visualizar) */}
      <Route
        path="/portal"
        element={
          <RotaProtegida papeis={['cliente', 'admin', 'equipe']}>
            <PortalLayout />
          </RotaProtegida>
        }
      >
        <Route index element={<PortalHomePage />} />
      </Route>

      <Route
        path="*"
        element={
          <div className="flex min-h-dvh items-center justify-center bg-fundo px-4">
            <EmptyState
              titulo="Página não encontrada"
              descricao="O endereço acessado não existe."
              className="w-full max-w-sm"
            />
          </div>
        }
      />
    </Routes>
  )
}
