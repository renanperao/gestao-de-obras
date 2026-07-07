import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const moedaBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatarMoeda(valor: number): string {
  return moedaBRL.format(valor)
}

function paraDate(data: string | Date): Date {
  return typeof data === 'string' ? parseISO(data) : data
}

export function formatarData(data: string | Date): string {
  return format(paraDate(data), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatarDataHora(data: string | Date): string {
  return format(paraDate(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
}

export function formatarDataLonga(data: string | Date): string {
  return format(paraDate(data), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
}

export function formatarPercentual(valor: number): string {
  const arredondado = Math.round(valor * 10) / 10
  return `${arredondado.toLocaleString('pt-BR')}%`
}

export function formatarMetragem(m2: number): string {
  return `${m2.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²`
}
