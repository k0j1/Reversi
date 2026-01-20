import { createClient } from '@supabase/supabase-js';

// Access environment variables using Vite's import.meta.env
// Casting to any to bypass TypeScript error regarding 'env' on ImportMeta
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

// Create client with fallback values if env vars are missing
// using a placeholder URL ensures createClient doesn't throw an "url is required" error immediately
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);