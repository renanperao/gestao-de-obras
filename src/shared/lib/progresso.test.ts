import { describe, expect, it } from 'vitest'
import {
  calcularProgressoEtapa,
  calcularProgressoObra,
  limitarPercentual,
  progressoPonderado,
} from './progresso'

describe('progressoPonderado', () => {
  it('retorna 0 sem itens', () => {
    expect(progressoPonderado([])).toBe(0)
  })

  it('retorna 0 quando a soma dos pesos é zero', () => {
    expect(progressoPonderado([{ progresso: 80, peso: 0 }])).toBe(0)
  })

  it('faz média simples com pesos iguais', () => {
    expect(
      progressoPonderado([
        { progresso: 100, peso: 1 },
        { progresso: 0, peso: 1 },
      ]),
    ).toBe(50)
  })

  it('pondera pelo peso', () => {
    // (100×3 + 0×1) / 4 = 75
    expect(
      progressoPonderado([
        { progresso: 100, peso: 3 },
        { progresso: 0, peso: 1 },
      ]),
    ).toBe(75)
  })

  it('arredonda a 2 casas como o trigger SQL', () => {
    // (100 + 0 + 0) / 3 = 33.333... → 33.33
    expect(
      progressoPonderado([
        { progresso: 100, peso: 1 },
        { progresso: 0, peso: 1 },
        { progresso: 0, peso: 1 },
      ]),
    ).toBe(33.33)
  })

  it('limita progresso de entrada fora do intervalo 0–100', () => {
    expect(
      progressoPonderado([
        { progresso: 150, peso: 1 },
        { progresso: -50, peso: 1 },
      ]),
    ).toBe(50)
  })

  it('aceita pesos fracionários', () => {
    // (50×0.5 + 100×1.5) / 2 = 87.5
    expect(
      progressoPonderado([
        { progresso: 50, peso: 0.5 },
        { progresso: 100, peso: 1.5 },
      ]),
    ).toBe(87.5)
  })
})

describe('cascata subetapa → etapa → obra', () => {
  it('propaga o progresso ponderado nos dois níveis', () => {
    const fundacao = calcularProgressoEtapa([
      { progresso: 100, peso: 1 }, // escavação
      { progresso: 100, peso: 2 }, // formas e armação
      { progresso: 50, peso: 2 },  // concretagem
    ])
    expect(fundacao).toBe(80)

    const alvenaria = calcularProgressoEtapa([
      { progresso: 0, peso: 1 },
      { progresso: 0, peso: 3 },
    ])
    expect(alvenaria).toBe(0)

    // (80×10 + 0×10) / 20 = 40
    expect(
      calcularProgressoObra([
        { progresso: fundacao, peso: 10 },
        { progresso: alvenaria, peso: 10 },
      ]),
    ).toBe(40)
  })
})

describe('limitarPercentual', () => {
  it('limita aos extremos', () => {
    expect(limitarPercentual(-5)).toBe(0)
    expect(limitarPercentual(105)).toBe(100)
    expect(limitarPercentual(42.5)).toBe(42.5)
  })
})
