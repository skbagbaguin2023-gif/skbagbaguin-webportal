import type { ResidentProfile } from '../types/index.ts';
import { getResidentProfile } from './residentProfile.ts';
import { supabase } from './supabase.ts';

export async function saveResidentProfile(profile: ResidentProfile): Promise<ResidentProfile> {
  if (!supabase) {
    throw new Error('Profile updates are unavailable because Supabase is not configured.');
  }
  const { data, error } = await supabase.auth.updateUser({
    data: { resident_profile: profile },
  });
  if (error) throw error;
  if (!data.user) throw new Error('The saved profile could not be confirmed.');
  return getResidentProfile(data.user);
}
