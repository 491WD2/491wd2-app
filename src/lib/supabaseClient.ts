import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

let browserClient: SupabaseClient | null = null;

/**
 * True when both public Supabase env vars are set. The anon key is safe to embed
 * in the SPA only together with strict RLS (see docs/backend-plan.md).
 */
export function isSupabaseConfigured(): boolean {
  return url.length > 0 && anonKey.length > 0;
}

/**
 * Singleton browser client for Supabase Auth and (later) PostgREST.
 * Returns null when env is unset so the app keeps running localStorage-first.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
