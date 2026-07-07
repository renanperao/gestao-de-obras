import { describe, expect, it } from 'vitest'
import type {
  Etapa,
  EtapaTemplate,
  Pavimento,
  Subetapa,
  SubetapaTemplate,
} from '@/shared/types/database'
import {
  agruparEstrutura,
  agruparTemplates,
  contarItensPlanejados,
  criarNomesPavimentos,
  resumirEstrutura,
} from './estrutura'

function pavimento(parcial: Partial<Pavimento>): Pavimento {
  return {
    id: 'p1',
    obra_id: 'obra',
    nome: 'Térreo',
    ordem: 1,
    ...parcial,
  }
}

function etapa(parcial: Partial<Etapa>): Etapa {
  return {
    id: 'e1',
    obra_id: 'obra',
    pavimento_id: 'p1',
    nome: 'Fundacao',
    peso: 1,
    ordem: 1,
    progresso: 0,
    instalando_agora: false,
    depende_de: null,
    template_origem: null,
    created_at: '2026-07-07T00:00:00Z',
    ...parcial,
  }
}

function subetapa(parcial: Partial<Subetapa>): Subetapa {
  return {
    id: 's1',
    etapa_id: 'e1',
    obra_id: 'obra',
    nome: 'Escavacao',
    peso: 1,
    ordem: 1,
    progresso: 0,
    ...parcial,
  }
}

function etapaTemplate(parcial: Partial<EtapaTemplate>): EtapaTemplate {
  return {
    id: 't1',
    nome: 'Fundacao',
    peso_sugerido: 1,
    ordem: 1,
    categoria: 'residencial',
    ...parcial,
  }
}

function subetapaTemplate(parcial: Partial<SubetapaTemplate>): SubetapaTemplate {
  return {
    id: 'st1',
    etapa_template_id: 't1',
    nome: 'Escavacao',
    peso_sugerido: 1,
    ordem: 1,
    ...parcial,
  }
}

describe('estrutura de obras', () => {
  it('cria nomes padrão de pavimentos', () => {
    expect(criarNomesPavimentos(1)).toEqual(['Térreo'])
    expect(criarNomesPavimentos(2)).toEqual(['Térreo', 'Superior'])
    expect(criarNomesPavimentos(3)).toEqual([
      'Térreo',
      '1º Pavimento',
      '2º Pavimento',
    ])
  })

  it('agrupa templates com subetapas ordenadas', () => {
    const templates = agruparTemplates(
      [
        etapaTemplate({ id: 't2', nome: 'Estrutura', ordem: 2 }),
        etapaTemplate({ id: 't1', nome: 'Fundacao', ordem: 1 }),
      ],
      [
        subetapaTemplate({ id: 'st2', etapa_template_id: 't1', nome: 'Forma', ordem: 2 }),
        subetapaTemplate({ id: 'st1', etapa_template_id: 't1', nome: 'Escavacao', ordem: 1 }),
      ],
    )

    expect(templates.map((template) => template.etapa.id)).toEqual(['t1', 't2'])
    expect(templates[0].subetapas.map((item) => item.id)).toEqual(['st1', 'st2'])
  })

  it('agrupa pavimentos, etapas e subetapas', () => {
    const agrupada = agruparEstrutura(
      [pavimento({ id: 'p2', nome: 'Superior', ordem: 2 }), pavimento({ id: 'p1' })],
      [
        etapa({ id: 'e2', pavimento_id: 'p2', nome: 'Estrutura', ordem: 2 }),
        etapa({ id: 'e1', pavimento_id: 'p1', nome: 'Fundacao', ordem: 1 }),
        etapa({ id: 'e3', pavimento_id: null, nome: 'Geral', ordem: 0 }),
      ],
      [
        subetapa({ id: 's2', etapa_id: 'e1', nome: 'Forma', ordem: 2, progresso: 100 }),
        subetapa({ id: 's1', etapa_id: 'e1', nome: 'Escavacao', ordem: 1 }),
      ],
    )

    expect(agrupada.pavimentos.map((item) => item.id)).toEqual(['p1', 'p2'])
    expect(agrupada.pavimentos[0].etapas[0].subetapas.map((item) => item.id)).toEqual([
      's1',
      's2',
    ])
    expect(agrupada.etapasGerais.map((item) => item.id)).toEqual(['e3'])
  })

  it('resume estrutura existente e planejada', () => {
    expect(
      resumirEstrutura(
        [etapa({ id: 'e1' }), etapa({ id: 'e2' })],
        [subetapa({ id: 's1', progresso: 100 }), subetapa({ id: 's2', progresso: 80 })],
      ),
    ).toEqual({
      totalEtapas: 2,
      totalSubetapas: 2,
      subetapasConcluidas: 1,
    })

    expect(
      contarItensPlanejados(['Térreo', 'Superior'], [
        {
          templateId: 't1',
          nome: 'Fundacao',
          peso: 1,
          ordem: 1,
          subetapas: [
            { templateId: 'st1', nome: 'Escavacao', peso: 1, ordem: 1 },
            { templateId: 'st2', nome: 'Forma', peso: 1, ordem: 2 },
          ],
        },
      ]),
    ).toEqual({
      totalEtapas: 2,
      totalSubetapas: 4,
      subetapasConcluidas: 0,
    })
  })
})
