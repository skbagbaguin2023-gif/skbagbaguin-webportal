import test from 'node:test';
import assert from 'node:assert/strict';
import { getAgeFromBirthday } from './residentProfile.ts';

test('calculates age from a birthday that has already occurred this year', () => {
  const today = new Date();
  const expectedAge = today.getFullYear() - 2000;
  assert.equal(getAgeFromBirthday('2000-01-01'), expectedAge);
});

test('does not return an age for a future or invalid birthday', () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const futureBirthday = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, '0'),
    String(tomorrow.getDate()).padStart(2, '0'),
  ].join('-');

  assert.equal(getAgeFromBirthday(futureBirthday), '');
  assert.equal(getAgeFromBirthday('not-a-date'), '');
  assert.equal(getAgeFromBirthday(''), '');
});
