// ==============================================================================
// RENTAL PS MANAGEMENT SYSTEM - SUPABASE CLIENT CONFIGURATION
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-supabase-project')
);

// Fallback dummy client if credentials are not configured yet
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : (createClient('https://mock-rental-ps.supabase.co', 'mock-anon-key', {
      auth: { persistSession: false },
    }) as any);

export function getSupabaseConfigStatus(): {
  isConfigured: boolean;
  url: string;
  hasKey: boolean;
} {
  return {
    isConfigured: isSupabaseConfigured,
    url: supabaseUrl ? supabaseUrl.replace(/^(https:\/\/[^.]+).*/, '$1.supabase.co') : 'Belum Dikonfigurasi',
    hasKey: Boolean(supabaseAnonKey),
  };
}
