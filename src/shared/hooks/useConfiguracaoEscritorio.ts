import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { aplicarBranding } from '@/shared/lib/branding'

/** Carrega o branding do escritório e o aplica nas CSS variables. */
export function useConfiguracaoEscritorio() {
  const consulta = useQuery({
    queryKey: ['configuracao_escritorio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracao_escritorio')
        .select('*')
        .eq('id', 1)
        .maybeSingle()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10,
  })

  useEffect(() => {
    if (consulta.data) aplicarBranding(consulta.data)
  }, [consulta.data])

  return consulta
}
