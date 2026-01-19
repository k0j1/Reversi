import { createClient } from '@supabase/supabase-js';

// Safely access environment variables to prevent runtime crashes if import.meta.env is undefined
const env = (import.meta as any).env;
const supabaseUrl = env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY || '';

// Create client with fallback values if env vars are missing
// using a placeholder URL ensures createClient doesn't throw an "url is required" error immediately
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);