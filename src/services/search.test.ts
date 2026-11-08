import test from 'node:test';
import assert from 'node:assert/strict';
import { expandSearchQuery, rankSearchMatch, sanitizeSearchQuery } from './searchLogic.ts';

test('sanitizes and bounds public search input', () => {
  assert.equal(sanitizeSearchQuery('  Café <script>alert(1)</script>  '), 'Café script alert 1 script');
  assert.equal(sanitizeSearchQuery('a'.repeat(100)).length, 80);
});

test('expands English and Filipino sports synonyms', () => {
  assert.deepEqual(expandSearchQuery('sports'), ['sports', 'sportsfest', 'liga', 'basketball']);
  assert.ok(expandSearchQuery('kabataan').includes('youth'));
});

test('ranks title matches above body-only matches', () => {
  assert.ok(rankSearchMatch('Sportsfest', 'Youth activities', 'sportsfest')
    > rankSearchMatch('Youth activities', 'Sportsfest details', 'sportsfest'));
});
