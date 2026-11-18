import type { User } from '@supabase/supabase-js';
import type { ResidentProfile } from '../types/index.ts';

export const EMPTY_RESIDENT_PROFILE: ResidentProfile = {
  firstName: '',
  middleName: '',
  lastName: '',
  contactNumber: '',
  birthday: '',
  genderIdentity: '',
  sitioAddress: '',
  completeAddress: '',
};

export function getResidentProfile(user: User | null): ResidentProfile {
  const metadata = user?.user_metadata?.resident_profile;
  if (!metadata || typeof metadata !== 'object') return { ...EMPTY_RESIDENT_PROFILE };

  const value = (key: keyof ResidentProfile) =>
    typeof metadata[key] === 'string' ? metadata[key].trim() : '';
  return {
    firstName: value('firstName'),
    middleName: value('middleName'),
    lastName: value('lastName'),
    contactNumber: value('contactNumber'),
    birthday: value('birthday'),
    genderIdentity: value('genderIdentity'),
    sitioAddress: value('sitioAddress'),
    completeAddress: value('completeAddress'),
  };
}

export function getAgeFromBirthday(birthday: string): number | '' {
  if (!birthday) return '';
  const birthDate = new Date(`${birthday}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const birthdayHasPassed = today.getMonth() > birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
  if (!birthdayHasPassed) age -= 1;
  return age >= 0 ? age : '';
}
