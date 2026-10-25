import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterPrograms,
  filterEvents,
  calculateEventCapacity,
  generateApplicationRef,
  validateYouthApplication,
  aggregateAdminMetrics,
} from './portalLogic.ts';
import { generateUuid } from './uuid.ts';
import { Program, EventItem, YouthApplication, Announcement } from '../types/index.ts';

test('generateUuid returns a valid version 4 UUID', () => {
  const uuid = generateUuid();
  assert.match(uuid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
});

test('filterPrograms matches search query, category, and status', () => {
  const samplePrograms: Program[] = [
    {
      id: 'p1',
      title: 'Youth Sports League 2026',
      summary: 'Inter-sitio basketball tournament',
      category: 'Sports',
      status: 'Ongoing',
      targetBeneficiaries: '300 youth athletes',
      allocatedBudget: 150000,
      progressPercent: 60,
      leadCouncilor: 'Hon. Mark Santos',
      timeline: 'Oct - Nov 2026',
      imageUrl: '/test.jpg',
      objectives: ['Promote fitness'],
    },
    {
      id: 'p2',
      title: 'Educational Assistance Grant',
      summary: 'Cash allowance for college students',
      category: 'Education',
      status: 'Upcoming',
      targetBeneficiaries: '150 college scholars',
      allocatedBudget: 450000,
      progressPercent: 20,
      leadCouncilor: 'Hon. Maria Cruz',
      timeline: 'Nov 2026',
      imageUrl: '/test2.jpg',
      objectives: ['Subsidize tuition'],
    },
  ];

  // Test query search
  const foundQuery = filterPrograms(samplePrograms, 'basketball');
  assert.equal(foundQuery.length, 1);
  assert.equal(foundQuery[0].id, 'p1');

  // Test category filter
  const foundCat = filterPrograms(samplePrograms, '', 'Education');
  assert.equal(foundCat.length, 1);
  assert.equal(foundCat[0].id, 'p2');

  // Test status filter
  const foundStatus = filterPrograms(samplePrograms, '', 'All', 'Ongoing');
  assert.equal(foundStatus.length, 1);
  assert.equal(foundStatus[0].id, 'p1');
});

test('calculateEventCapacity correctly identifies remaining slots and capacity state', () => {
  const result = calculateEventCapacity(100, 45);
  assert.equal(result.slotsRemaining, 55);
  assert.equal(result.percentFilled, 45);
  assert.equal(result.isFull, false);

  const fullResult = calculateEventCapacity(100, 100);
  assert.equal(fullResult.slotsRemaining, 0);
  assert.equal(fullResult.percentFilled, 100);
  assert.equal(fullResult.isFull, true);
});

test('generateApplicationRef formats civic reference codes consistently', () => {
  const refEdu = generateApplicationRef('Educational Assistance', 42);
  assert.match(refEdu, /^SKB-EDU-\d{4}-0042$/);

  const refKKP = generateApplicationRef('Youth Profiling & Katipunan ng Kabataan Registration', 105);
  assert.match(refKKP, /^SKB-KKP-\d{4}-0105$/);

  const refPrinting = generateApplicationRef('Printing Services', 7);
  assert.match(refPrinting, /^SKB-PRT-\d{4}-0007$/);
});

test('validateYouthApplication enforces Philippine Youth age and Data Privacy consent', () => {
  // Invalid age (e.g. 12 years old)
  const underageResult = validateYouthApplication({
    applicantName: 'Juan Dela Cruz',
    age: 12,
    sitio: 'Sitio Libis',
    contactNumber: '09171234567',
    email: 'juan@example.com',
    serviceType: 'Educational Assistance',
    dataPrivacyConsent: true,
  });
  assert.equal(underageResult.isValid, false);
  assert.ok(underageResult.errors.age);

  // Missing data privacy consent
  const noConsentResult = validateYouthApplication({
    applicantName: 'Maria Santos',
    age: 21,
    sitio: 'Sitio Centro',
    contactNumber: '09181234567',
    email: 'maria@example.com',
    serviceType: 'Educational Assistance',
    dataPrivacyConsent: false,
  });
  assert.equal(noConsentResult.isValid, false);
  assert.ok(noConsentResult.errors.dataPrivacyConsent);

  // Valid youth application
  const validResult = validateYouthApplication({
    applicantName: 'Maria Santos',
    age: 21,
    sitio: 'Sitio Centro',
    contactNumber: '09181234567',
    email: 'maria@example.com',
    serviceType: 'Educational Assistance',
    dataPrivacyConsent: true,
  });
  assert.equal(validResult.isValid, true);
});

test('aggregateAdminMetrics accurately counts ongoing and pending states', () => {
  const announcements = [{ id: '1' }, { id: '2' }] as Announcement[];
  const programs = [
    { id: '1', status: 'Ongoing' },
    { id: '2', status: 'Completed' },
  ] as Program[];
  const events = [
    { id: '1', status: 'Registration Open' },
    { id: '2', status: 'Completed' },
  ] as EventItem[];
  const applications = [
    { id: '1', status: 'Pending' },
    { id: '2', status: 'Under Review' },
    { id: '3', status: 'Approved' },
  ] as YouthApplication[];

  const metrics = aggregateAdminMetrics(announcements, programs, events, applications);
  assert.equal(metrics.totalAnnouncements, 2);
  assert.equal(metrics.activePrograms, 1);
  assert.equal(metrics.upcomingEvents, 1);
  assert.equal(metrics.pendingApplications, 2);
});
