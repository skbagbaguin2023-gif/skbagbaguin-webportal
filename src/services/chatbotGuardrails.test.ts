import test from 'node:test';
import assert from 'node:assert/strict';
import { fallbackResponse, matchVerifiedFaq, validateChatbotRequest } from './chatbotGuardrails.ts';

test('validates chatbot request shape and message length', () => {
  const valid = validateChatbotRequest({
    message: 'What services are available?',
    context: { userRole: 'guest', currentPage: '/' },
    recentMessages: [],
  });
  assert.equal('request' in valid, true);
  assert.equal('error' in validateChatbotRequest({
    message: 'x'.repeat(501),
    context: { userRole: 'guest', currentPage: '/' },
    recentMessages: [],
  }), true);
});

test('matches verified route FAQs without inventing office details', () => {
  const answer = matchVerifiedFaq('Where can I see the latest announcements?');
  assert.equal(answer?.category, 'announcements');
  assert.deepEqual(answer?.knowledge, ['page:announcements']);
  const contact = matchVerifiedFaq('What is the office address and phone number?');
  assert.match(contact?.reply ?? '', /official Contact page/i);
  assert.doesNotMatch(contact?.reply ?? '', /\+639|09\d{9}/);
});

test('returns a safe fallback for unsupported questions', () => {
  const answer = matchVerifiedFaq('Can you give me legal advice?');
  assert.equal(answer, null);
  assert.equal(fallbackResponse().source, 'fallback');
});
