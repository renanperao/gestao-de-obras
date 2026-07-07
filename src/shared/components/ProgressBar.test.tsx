import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('expõe o valor por aria e limita a 0–100', () => {
    render(<ProgressBar valor={140} mostrarRotulo />)
    const barra = screen.getByRole('progressbar')
    expect(barra).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('arredonda o rótulo', () => {
    render(<ProgressBar valor={33.33} mostrarRotulo />)
    expect(screen.getByText('33%')).toBeInTheDocument()
  })
})
