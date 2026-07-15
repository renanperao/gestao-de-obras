import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Nomes das variáveis de ambiente do Supabase que faltaram no build.
 *
 * No Vite, `import.meta.env.VITE_*` é substituído pelo valor literal no momento
 * do build. Se as variáveis não estiverem definidas no ambiente de build
 * (ex.: painel da Vercel), elas chegam aqui como `undefined`. Em vez de lançar
 * um erro já no import — o que derruba o app antes do React montar e deixa a
 * tela em branco —, expomos a lista para a UI mostrar a tela de
 * "Configuração ausente" (ver main.tsx).
 */
export const variaveisSupabaseAusentes: string[] = [
  { nome: 'VITE_SUPABASE_URL', valor: url },
  { nome: 'VITE_SUPABASE_ANON_KEY', valor: anonKey },
]
  .filter((v) => !v.valor)
  .map((v) => v.nome)

export const configuracaoSupabaseValida = variaveisSupabaseAusentes.length === 0

// Placeholders válidos (porém inertes) evitam que o createClient lance no import
// quando falta configuração. Nesse cenário a tela de erro bloqueia o uso do app,
// então o cliente com placeholder nunca chega a fazer requisições reais.
export const supabase = createClient<Database>(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
)
