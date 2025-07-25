import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Credenciais do Supabase não encontradas. Verifique seu arquivo .env.local.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);