import { isAdminUser, supabase } from '../services/supabase.ts';

export async function login(email, password) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!isAdminUser(data.user)) {
    await supabase.auth.signOut();
    return false;
  }
  return true;
}

export async function logout() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}
