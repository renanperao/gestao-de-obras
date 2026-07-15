import { Component, type ErrorInfo, type ReactNode } from 'react'
import { TelaErro } from './TelaErro'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  erro: Error | null
  pilhaComponentes: string | null
}

/**
 * Captura erros lançados durante a renderização do React (render, lifecycle,
 * construtores) e mostra a TelaErro em vez de deixar a tela em branco.
 *
 * Limitação do React: NÃO captura erros em handlers de eventos, código async
 * ou fora da árvore — esses são registrados por listeners globais no main.tsx.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { erro: null, pilhaComponentes: null }

  static getDerivedStateFromError(erro: Error): Partial<ErrorBoundaryState> {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    this.setState({ pilhaComponentes: info.componentStack ?? null })
    console.error('[ErrorBoundary] erro não tratado na renderização:', erro, info)
  }

  render() {
    const { erro, pilhaComponentes } = this.state
    if (!erro) return this.props.children

    const detalhes = [
      erro.stack || `${erro.name}: ${erro.message}`,
      pilhaComponentes ? `\n\nPilha de componentes:${pilhaComponentes}` : '',
    ].join('')

    return (
      <TelaErro
        titulo="Algo deu errado"
        descricao="O aplicativo encontrou um erro inesperado e não conseguiu continuar. Recarregar costuma resolver; se persistir, copie os detalhes abaixo."
        detalhes={detalhes}
        aoRecarregar={() => window.location.reload()}
      />
    )
  }
}
