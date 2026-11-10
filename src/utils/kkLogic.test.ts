import test from 'node:test';
import assert from 'node:assert/strict';
import { getKkAge, isKkVerified, normalizeKkPhone } from './kkLogic.ts';

test('getKkAge validates dates and handles birthdays accurately', () => {
  const today = new Date(2026, 5, 15);
  assert.equal(getKkAge('2011-06-15', today), 15);
  assert.equal(getKkAge('2011-06-16', today), 14);
  assert.equal(getKkAge('2027-01-01', today), null);
  assert.equal(getKkAge('2026-02-30', today), null);
});

test('normalizeKkPhone removes only spaces and hyphens', () => {
  assert.equal(normalizeKkPhone('0912 345-6789'), '09123456789');
  assert.equal(normalizeKkPhone('+639123456789'), '+639123456789');
});

test('only verified KK responses satisfy the service-access predicate', () => {
  assert.equal(isKkVerified('verified'), true);
  assert.equal(isKkVerified('pending'), false);
  assert.equal(isKkVerified('needs_review'), false);
  assert.equal(isKkVerified('rejected'), false);
  assert.equal(isKkVerified(null), false);
});
