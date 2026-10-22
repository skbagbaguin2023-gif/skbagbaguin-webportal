import { Program, ProgramCategory, ProgramStatus, EventItem, EventCategory, YouthApplication, Announcement } from '../types/index.ts';

/**
 * Filter programs by search term, category, and status.
 */
export function filterPrograms(
  programs: Program[],
  query: string = '',
  category: ProgramCategory = 'All',
  status: 'All' | ProgramStatus = 'All'
): Program[] {
  const q = query.trim().toLowerCase();
  return programs.filter((p) => {
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.targetBeneficiaries.toLowerCase().includes(q);

    const matchesCategory = category === 'All' || p.category === category;
    const matchesStatus = status === 'All' || p.status === status;

    return matchesQuery && matchesCategory && matchesStatus;
  });
}

/**
 * Filter events by search term, category, and month string (e.g., '2026-10' or 'All').
 */
export function filterEvents(
  events: EventItem[],
  query: string = '',
  category: 'All' | EventCategory = 'All',
  monthFilter: string = 'All'
): EventItem[] {
  const q = query.trim().toLowerCase();
  return events.filter((e) => {
    const matchesQuery =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q) ||
      e.summary.toLowerCase().includes(q);

    const matchesCategory = category === 'All' || e.category === category;
    const matchesMonth = monthFilter === 'All' || e.date.startsWith(monthFilter);

    return matchesQuery && matchesCategory && matchesMonth;
  });
}

/**
 * Calculates slots remaining, percentage filled, and whether the event is at capacity.
 */
export function calculateEventCapacity(capacity: number, registeredCount: number) {
  const safeCapacity = Math.max(0, capacity);
  const safeCount = Math.max(0, registeredCount);
  const slotsRemaining = Math.max(0, safeCapacity - safeCount);
  const percentFilled = safeCapacity === 0 ? 100 : Math.min(100, Math.round((safeCount / safeCapacity) * 100));
  const isFull = safeCount >= safeCapacity;

  return {
    slotsRemaining,
    percentFilled,
    isFull,
  };
}

/**
 * Generate human-readable civic application reference code (e.g. SKB-EDU-2026-084)
 */
export function generateApplicationRef(serviceType: string, sequenceNum: number): string {
  let prefix = 'GEN';
  if (serviceType.includes('Educational')) prefix = 'EDU';
  else if (serviceType.includes('Profiling')) prefix = 'KKP';
  else if (serviceType.includes('Facility')) prefix = 'FAC';
  else if (serviceType.includes('Concern')) prefix = 'CON';
  else if (serviceType.includes('Endorsement')) prefix = 'END';

  const paddedNum = String(sequenceNum).padStart(4, '0');
  const year = new Date().getFullYear();
  return `SKB-${prefix}-${year}-${paddedNum}`;
}

/**
 * Formats Philippine Peso figures with commas and standard currency sign.
 */
export function formatCurrencyPHP(amount: number): string {
  return `₱${amount.toLocaleString('en-US')}`;
}

/**
 * Validation rules for Youth Portal submissions.
 */
export interface ApplicationFormInput {
  applicantName: string;
  age: number | string;
  sitio: string;
  contactNumber: string;
  email: string;
  serviceType: string;
  dataPrivacyConsent: boolean;
}

export function validateYouthApplication(input: ApplicationFormInput): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.applicantName || input.applicantName.trim().length < 3) {
    errors.applicantName = 'Full legal name is required (minimum 3 characters).';
  }

  const numAge = Number(input.age);
  if (!input.age || isNaN(numAge) || numAge < 15 || numAge > 30) {
    errors.age = 'Applicant must be between 15 and 30 years old (SK Republic Act 10742).';
  }

  if (!input.sitio || input.sitio.trim() === '') {
    errors.sitio = 'Please select your resident Sitio in Barangay Bagbaguin.';
  }

  const phoneRegex = /^(09|\+639)\d{9}$/;
  if (!input.contactNumber || !phoneRegex.test(input.contactNumber.replace(/[\s-]/g, ''))) {
    errors.contactNumber = 'Please enter a valid 11-digit Philippine mobile number (e.g., 09171234567).';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.email || !emailRegex.test(input.email)) {
    errors.email = 'Please provide a valid email address for application tracking.';
  }

  if (!input.dataPrivacyConsent) {
    errors.dataPrivacyConsent = 'Consent is mandatory under the Philippine Data Privacy Act of 2012.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Aggregate metrics for Admin Dashboard
 */
export function aggregateAdminMetrics(
  announcements: Announcement[],
  programs: Program[],
  events: EventItem[],
  applications: YouthApplication[]
) {
  const totalAnnouncements = announcements.length;
  const activePrograms = programs.filter((p) => p.status === 'Ongoing').length;
  const upcomingEvents = events.filter((e) => e.status !== 'Completed').length;
  const pendingApplications = applications.filter((a) => a.status === 'Pending' || a.status === 'Under Review').length;

  return {
    totalAnnouncements,
    activePrograms,
    upcomingEvents,
    pendingApplications,
  };
}
