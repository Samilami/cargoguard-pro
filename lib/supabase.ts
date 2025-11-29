import { createClient } from '@supabase/supabase-js';

// WICHTIG: Diese Werte müssen aus deinem Supabase-Projekt kommen
// 1. Gehe zu https://app.supabase.com
// 2. Erstelle ein neues Projekt
// 3. Gehe zu Settings > API
// 4. Kopiere die URL und den anon/public key hierher

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
