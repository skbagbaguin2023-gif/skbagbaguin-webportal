import type { KkResponseStatus, KkProfilingData } from '../types/index.ts';

export const KK_PRIVACY_NOTICE_VERSION = 'kk-v1';

export function normalizeKkPhone(value: string): string {
  return value.replace(/[\s-]/g, '');
}

export function getKkAge(birthday: string, onDate = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
    || date > new Date(Date.UTC(onDate.getFullYear(), onDate.getMonth(), onDate.getDate()))
  ) {
    return null;
  }

  const birthdayHasPassed = onDate.getMonth() + 1 > month
    || (onDate.getMonth() + 1 === month && onDate.getDate() >= day);
  return onDate.getFullYear() - year - (birthdayHasPassed ? 0 : 1);
}

export function validateKkProfile(
  profile: KkProfilingData,
  privacyConsent: boolean,
  onDate = new Date()
): Record<string, string> {
  const errors: Record<string, string> = {};
  const ageOnBirthday = getKkAge(profile.birthday, onDate);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (!Number.isInteger(profile.age) || profile.age < 15 || profile.age > 30) {
    errors.age = 'KK profiling is for youth ages 15 to 30.';
  }
  if (ageOnBirthday === null) {
    errors.birthday = 'Enter a valid birthday that is not in the future.';
  } else if (ageOnBirthday !== profile.age) {
    errors.birthday = 'The age does not match the birthday.';
  }
  if (!/^(09\d{9}|\+639\d{9})$/.test(normalizeKkPhone(profile.contactNumber))) {
    errors.contactNumber = 'Enter a valid Philippine mobile number.';
  }
  if (profile.youthClassifications.length === 0) {
    errors.youthClassifications = 'Choose at least one youth classification.';
  }
  if (profile.sitioAddress === 'Iba pa:' && !profile.sitioOther.trim()) {
    errors.sitioOther = 'Enter your street or sitio.';
  }
  if (profile.skElectionVoteCount === 'Iba pa:' && !profile.skElectionVoteCountOther.trim()) {
    errors.skElectionVoteCountOther = 'Enter the number of SK elections.';
  }
  if (!privacyConsent) {
    errors.privacyConsent = 'Data privacy consent is required.';
  }

  return errors;
}

export function isKkVerified(status: KkResponseStatus | string | null | undefined): boolean {
  return status === 'verified';
}
