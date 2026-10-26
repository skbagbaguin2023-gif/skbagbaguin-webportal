import test from 'node:test';
import assert from 'node:assert/strict';
import { isLocalDevelopmentImageUrl } from './image.ts';

test('detects local and source-tree image URLs that cannot resolve after deployment', () => {
  assert.equal(isLocalDevelopmentImageUrl('http://localhost:5173/src/assets/images/photo.jpg'), true);
  assert.equal(isLocalDevelopmentImageUrl('/src/assets/images/photo.jpg'), true);
  assert.equal(isLocalDevelopmentImageUrl('/assets/images/photo.jpg'), true);
});

test('keeps deployed asset and public storage URLs eligible to load', () => {
  assert.equal(isLocalDevelopmentImageUrl('/assets/photo-D3c8Jf0a.jpg'), false);
  assert.equal(isLocalDevelopmentImageUrl('https://project.supabase.co/storage/v1/object/public/portal-images/announcements/photo.webp'), false);
});
