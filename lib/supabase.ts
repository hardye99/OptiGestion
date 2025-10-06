import { createClient } from '@supabase/supabase-js';

// Validación de variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Falta configurar las variables de entorno de Supabase');
}

// Cliente de Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
