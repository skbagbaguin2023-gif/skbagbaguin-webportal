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

test('matches common Tagalog route questions', () => {
  const programs = matchVerifiedFaq('Ano ang mga programa para sa kabataan?');
  assert.equal(programs?.category, 'programs');
  assert.match(programs?.reply ?? '', /Programs page/);
  const announcements = matchVerifiedFaq('Saan makikita ang mga bagong anunsyo?');
  assert.equal(announcements?.category, 'announcements');
});

test('returns a safe fallback for unsupported questions', () => {
  const answer = matchVerifiedFaq('Can you give me legal advice?');
  assert.equal(answer, null);
  assert.equal(fallbackResponse().source, 'fallback');
  assert.match(fallbackResponse('Paano ako makakakuha ng tulong?').reply, /Wala pa akong beripikadong impormasyon/);
});
