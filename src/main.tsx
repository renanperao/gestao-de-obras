import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import '@fontsource/raleway/300.css'
import '@fontsource/raleway/400.css'
import '@fontsource/raleway/500.css'
import '@fontsource/raleway/600.css'
import '@fontsource/raleway/700.css'
import '@/styles/global.css'

import { App } from '@/App'
import { AuthProvider } from '@/shared/auth/AuthProvider'
import { ErrorBoundary, TelaErro, ToastProvider } from '@/shared/components'
import {
  configuracaoSupabaseValida,
  variaveisSupabaseAusentes,
} from '@/shared/lib/supabase'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

// Erros assíncronos (fora do ciclo de render do React) não são capturados pelo
// ErrorBoundary; registramos no console para não passarem despercebidos.
window.addEventListener('unhandledrejection', (evento) => {
  console.error('[Promessa rejeitada sem tratamento]', evento.reason)
})
window.addEventListener('error', (evento) => {
  console.error('[Erro não tratado]', evento.error ?? evento.message)
})

function ConteudoApp() {
  // Configuração ausente (ex.: variáveis do Supabase não definidas no build da
  // Vercel): mostra uma tela explicativa em vez de quebrar com tela branca.
  if (!configuracaoSupabaseValida) {
    return (
      <TelaErro
        titulo="Configuração ausente"
        descricao="O aplicativo carregou, mas as variáveis de ambiente do Supabase não foram definidas no build. Configure-as no painel de hospedagem (na Vercel: Settings → Environment Variables) e faça um novo deploy."
        detalhes={`Variáveis de ambiente ausentes no build:\n${variaveisSupabaseAusentes
          .map((nome) => `  • ${nome}`)
          .join('\n')}`}
        aoRecarregar={() => window.location.reload()}
      />
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const elementoRaiz = document.getElementById('root')

try {
  if (!elementoRaiz) {
    throw new Error('Elemento #root não encontrado no HTML.')
  }
  createRoot(elementoRaiz).render(
    <StrictMode>
      <ErrorBoundary>
        <ConteudoApp />
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (erro) {
  // Último recurso: se nem o React conseguir montar, injeta um aviso em HTML
  // puro para o usuário não ficar diante de uma tela totalmente em branco.
  console.error('[Falha crítica ao iniciar o app]', erro)
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  if (elementoRaiz) {
    elementoRaiz.innerHTML = `
      <div style="min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:1rem;font-family:system-ui,sans-serif;background:#faf8f5;color:#1a1a1a">
        <div style="max-width:28rem;text-align:center">
          <h1 style="font-size:1.125rem;font-weight:600;margin:0 0 .5rem">Não foi possível iniciar</h1>
          <p style="font-size:.875rem;color:#6f6a64;line-height:1.5;margin:0">Ocorreu uma falha crítica ao carregar o aplicativo. Recarregue a página; se persistir, avise o suporte.</p>
          <pre style="margin:1rem 0 0;text-align:left;white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #e8e4de;border-radius:8px;padding:.75rem;font-size:.75rem;color:#6f6a64">${escaparHtml(mensagem)}</pre>
        </div>
      </div>`
  }
}
