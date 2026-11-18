import assert from 'node:assert/strict';
import test from 'node:test';
import { getUserFacingError } from './userFacingError.ts';

test('turns invalid Supabase login credentials into a helpful sign-in message', () => {
  assert.equal(
    getUserFacingError({ code: 'invalid_credentials', message: 'Invalid login credentials' }, 'Fallback'),
    'The email or password is incorrect. Check your details or use Forgot password to reset your password.',
  );
});

test('maps Supabase permission errors without exposing database policy text', () => {
  assert.equal(
    getUserFacingError({ code: '42501', message: 'new row violates row-level security policy' }, 'Fallback'),
    'You do not have permission to complete this action. Sign in with the appropriate account and try again.',
  );
});

test('preserves application-authored errors and uses a fallback for unknown Supabase errors', () => {
  assert.equal(getUserFacingError(new Error('Choose a valid date.'), 'Fallback'), 'Choose a valid date.');
  assert.equal(getUserFacingError({ code: 'XX000', message: 'internal database detail' }, 'Fallback'), 'Fallback');
});
