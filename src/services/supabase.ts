import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

const adminUids = new Set(
  (import.meta.env.VITE_SUPABASE_ADMIN_UIDS ?? '')
    .split(',')
    .map((uid: string) => uid.trim())
    .filter(Boolean)
);

export function isAdminUser(user: User | null): boolean {
  return user !== null && adminUids.has(user.id);
}

export function observeAuthState(callback: (user: User | null) => void): () => void {
  if (!supabase) {
    callback(null);
    return () => undefined;
  }

  let isActive = true;
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  void supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Unable to restore the Supabase session.', error);
      if (isActive) callback(null);
      return;
    }
    if (isActive) callback(data.session?.user ?? null);
  });

  return () => {
    isActive = false;
    subscription.unsubscribe();
  };
}
