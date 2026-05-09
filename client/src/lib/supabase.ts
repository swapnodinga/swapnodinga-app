import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env vars are missing (e.g., in a preview/deploy with missing envs),
// provide a safe stub that won't throw at import time. This prevents a
// hard crash like "supabaseUrl is required" so the app can render an
// informative UI instead of a white screen.
let _supabase: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase not configured: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing');

  const stubFrom = (_: string) => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
    update: async () => ({ data: null, error: new Error('Supabase not configured') }),
    delete: async () => ({ data: null, error: new Error('Supabase not configured') }),
    order: () => ({ select: async () => ({ data: [], error: null }) }),
    eq: () => ({ select: async () => ({ data: [], error: null }) }),
  });

  const stubStorage = {
    from: (_: string) => ({
      upload: async () => ({ error: new Error('Supabase storage not configured') }),
      getPublicUrl: (_path: string) => ({ data: { publicUrl: '' } }),
    })
  };

  const stubAuth = {
    onAuthStateChange: () => ({ data: null, error: null }),
    signIn: async () => ({ data: null, error: new Error('Supabase auth not configured') }),
    signOut: async () => ({ data: null, error: new Error('Supabase auth not configured') })
  };

  _supabase = {
    from: stubFrom,
    storage: stubStorage,
    auth: stubAuth,
  };

} else {
  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  });
}

export const supabase = _supabase;