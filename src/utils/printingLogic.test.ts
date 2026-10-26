import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePrintingRequest } from './printingLogic.ts';

const validRequest = {
  applicantName: 'Juan Dela Cruz',
  requestedDate: '2026-10-27',
  copiesNeeded: 3,
  purpose: 'School handouts',
  address: '123 Sampaguita St., Bagbaguin',
  contactNumber: '09171234567',
  pdf: { name: 'handout.pdf', type: 'application/pdf', size: 1024 },
  today: '2026-10-26',
};

test('accepts a complete printing request with a PDF below the 10 MB limit', () => {
  assert.deepEqual(validatePrintingRequest(validRequest), {});
});

test('rejects a non-PDF, empty file, or PDF over 10 MB', () => {
  assert.equal(validatePrintingRequest({
    ...validRequest,
    pdf: { name: 'document.png', type: 'image/png', size: 1024 },
  }).files, 'Choose a PDF file only.');
  assert.equal(validatePrintingRequest({
    ...validRequest,
    pdf: { name: 'empty.pdf', type: 'application/pdf', size: 0 },
  }).files, 'The PDF must be larger than 0 bytes and 10 MB or smaller.');
  assert.equal(validatePrintingRequest({
    ...validRequest,
    pdf: { name: 'large.pdf', type: 'application/pdf', size: 10 * 1024 * 1024 + 1 },
  }).files, 'The PDF must be larger than 0 bytes and 10 MB or smaller.');
});

test('requires the requested date, copies, purpose, resident address, and phone number', () => {
  const errors = validatePrintingRequest({
    ...validRequest,
    requestedDate: '2026-10-25',
    copiesNeeded: 0,
    purpose: ' ',
    address: '123',
    contactNumber: '12345',
  });
  assert.equal(errors.requestedDate, 'Choose today or a future date.');
  assert.ok(errors.copiesNeeded);
  assert.ok(errors.details);
  assert.ok(errors.address);
  assert.ok(errors.contactNumber);
});
