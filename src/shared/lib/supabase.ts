import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env (veja .env.example)',
  )
}

export const supabase = createClient<Database>(url, anonKey)
