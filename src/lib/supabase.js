import { createClient } from '@supabase/supabase-js';
import { ENV } from './config/env';

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (err) {
    console.warn('[BLS-SUPABASE] Failed to initialize Supabase client:', err.message);
  }
} else {
  console.warn('[BLS-SUPABASE] Supabase credentials missing — client disabled');
}

export { supabase };
