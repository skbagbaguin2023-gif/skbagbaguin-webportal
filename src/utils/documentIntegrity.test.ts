import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFileSha256 } from './documentIntegrity.ts';

test('calculates a stable SHA-256 checksum for uploaded content', async () => {
  const file = new File(['abc'], 'report.pdf', { type: 'application/pdf' });
  assert.equal(
    await calculateFileSha256(file),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});
