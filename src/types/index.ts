export type UserRole = 'resident' | 'admin';

export type PublicPage = 
  | 'home' 
  | 'about' 
  | 'programs' 
  | 'events' 
  | 'announcements' 
  | 'facebookPosts'
  | 'services'
  | 'track'
  | 'transparency' 
  | 'contact'
  | 'kk-status';

export type AdminSection = 
  | 'dashboard' 
  | 'announcements' 
  | 'facebookPosts'
  | 'programs' 
  | 'events' 
  | 'applications' 
  | 'transparency' 
  | 'feedback'
  | 'council'
  | 'services'
  | 'kkResponses'
  | 'maintenance';

export type ProgramCategory = 'All' | 'Education' | 'Sports' | 'Livelihood' | 'Environment' | 'Health' | 'Leadership';
export type ProgramStatus = 'Upcoming' | 'Ongoing' | 'Completed';

export interface Program {
  id: string;
  title: string;
  summary: string;
  category: ProgramCategory;
  status: ProgramStatus;
  targetBeneficiaries: string;
  allocatedBudget: number;
  spentBudget?: number;
  progressPercent: number;
  leadCouncilor: string;
  timeline: string;
  imageUrl: string;
  objectives: string[];
  requirements?: string[];
  keyOutputs?: string[];
  fiscalYear?: number;
}

export interface ProgramFiscalYear {
  id: string;
  year: number;
  totalFunds: number;
  totalDisbursed: number;
  isCurrent?: boolean;
}

export type EventStatus = 'Registration Open' | 'Limited Slots' | 'Full' | 'Completed';
export type EventCategory = 'Sports' | 'Leadership' | 'Community' | 'Health' | 'Arts & Culture';

export interface EventItem {
  id: string;
  title: string;
  summary: string;
  category: EventCategory;
  date: string; // YYYY-MM-DD
  time: string;
  venue: string;
  capacity: number;
  registeredCount: number;
  status: EventStatus;
  imageUrl?: string;
  targetAge: string;
  registrationDeadline: string;
  description: string;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  fullName: string;
  age: number;
  sitio: string;
  contactNumber: string;
  email: string;
  emergencyContact: string;
  registeredAt: string;
  status: 'Confirmed' | 'Waitlisted' | 'Checked-In';
  registrationCode: string;
}

export type AnnouncementCategory = 'General Notice' | 'Scholarships' | 'Sports Leagues' | 'Public Safety' | 'Youth Assemblies' | 'Health';
export type AnnouncementStatus = 'Published' | 'Draft';

export interface Announcement {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: AnnouncementCategory;
  author: string;
  date: string;
  status: AnnouncementStatus;
  isPinned?: boolean;
  coverImage?: string;
  sourcePostUrl?: string;
}

export interface FacebookPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  imageUrl: string;
  imageUrls?: string[];
  postUrl: string;
  isFallback?: boolean;
}

export type ServiceType = string;

export interface YouthService {
  id: string;
  name: string;
  tagline: string;
  description: string;
  turnaroundTime: string;
  eligibility: string[];
  requirements: string[];
  isActive: boolean;
}

export type MaintenanceSeverity = 'Low' | 'Medium' | 'High' | 'Critical';
export type MaintenanceStatus = 'Open' | 'Investigating' | 'Resolved' | 'Closed';
export type MaintenanceArea = 'Public Portal' | 'Admin Dashboard' | 'Supabase' | 'Chatbot' | 'Forms' | 'Deployment' | 'Other';

export interface MaintenanceIssue {
  id: string;
  title: string;
  description: string;
  area: MaintenanceArea;
  severity: MaintenanceSeverity;
  status: MaintenanceStatus;
  stepsToReproduce?: string;
  resolution?: string;
  reportedBy: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';
export type NotificationPreference = 'Messenger' | 'SMS' | 'Phone call';

export interface YouthApplication {
  id: string;
  refNumber: string;
  applicantName: string;
  age?: number;
  birthday?: string;
  gender?: string;
  sitio?: string;
  address: string;
  contactNumber: string;
  notificationPreference?: NotificationPreference;
  messengerName?: string;
  messengerProfileUrl?: string;
  email?: string;
  serviceType: ServiceType;
  schoolOrOrg?: string;
  yearLevel?: string;
  details?: string;
  requestedDate?: string;
  dateNeeded?: string;
  copiesNeeded?: number;
  kkProfile?: KkProfilingData;
  googleSyncStatus?: 'Pending' | 'Synced' | 'Failed';
  googleSyncError?: string;
  status: ApplicationStatus;
  submittedAt: string;
  adminNotes?: string;
  documentsAttached: {
    name: string;
    size: string;
    status: 'Verified' | 'Pending Review';
    storagePath?: string;
  }[];
}

export interface KkProfilingData {
  email: string;
  firstName: string;
  middleName: string;
  lastName: string;
  genderIdentity: string;
  age: number;
  birthday: string;
  birthplace: string;
  contactNumber: string;
  civilStatus: string;
  sitioAddress: string;
  sitioOther: string;
  completeAddress: string;
  voterStatus: string;
  votedLastSkElection: string;
  skElectionVoteCount: string;
  skElectionVoteCountOther: string;
  nationalVoter: string;
  precinctNumber: string;
  youthClassifications: string[];
  workStatus: string;
  educationalBackground: string;
}

export type KkResponseStatus = 'pending' | 'verified' | 'needs_review' | 'rejected';
export type KkResponseSource = 'google_form_legacy' | 'portal';

export interface KkResponse {
  id: string;
  source: KkResponseSource;
  source_record_id: string | null;
  portal_application_id: string | null;
  google_form_response_id: string | null;
  import_batch_id: string | null;
  ref_number: string;
  original_timestamp: string | null;
  original_timestamp_raw: string | null;
  status: KkResponseStatus;
  needs_review: boolean;
  review_notes: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string | null;
  email_address: string | null;
  email_account: string | null;
  gender_identity: string;
  age: number | null;
  birthday: string | null;
  birthplace: string;
  contact_number: string;
  civil_status: string;
  sitio_address: string;
  sitio_other: string;
  complete_address: string;
  voter_status: string;
  voted_last_sk_election: string;
  sk_election_vote_count: string;
  sk_election_vote_count_other: string;
  national_voter: string;
  precinct_number: string;
  youth_classifications: string[];
  work_status: string;
  educational_background: string;
  source_payload: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  privacy_consent_at: string | null;
  privacy_notice_version: string | null;
}

export type KkAdminResponse = Omit<KkResponse, 'source_payload' | 'created_by'>;

export interface KkAggregateReport {
  pending: number | '<5';
  verified: number | '<5';
  needs_review: number | '<5';
  rejected: number | '<5';
}

export type DocCategory = 'Annual Investment Plan (AIP)' | 'CBYDP' | 'Financial & Liquidation' | 'Accomplishment Report' | 'SK Resolution';

export interface TransparencyDoc {
  id: string;
  title: string;
  category: DocCategory;
  year: number;
  quarter?: string;
  documentType: 'PDF' | 'XLSX';
  fileSize: string;
  resolutionNumber?: string;
  publishedDate: string;
  isPublic: boolean;
  description: string;
  storagePath?: string;
}

export interface CouncilMember {
  id: string;
  sortOrder?: number;
  name: string;
  position: string;
  committee: string;
  term: string;
  bio: string;
  imageUrl: string;
  motto: string;
}

export interface FeedbackSuggestion {
  id: string;
  senderName: string;
  email: string;
  contact?: string;
  sitio: string;
  isAnonymous: boolean;
  category: 'Infrastructure & Facilities' | 'Sports & Tournaments' | 'Scholarship Queries' | 'Peace & Order' | 'General Suggestion';
  subject: string;
  message: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'New' | 'In Progress' | 'Resolved';
  submittedAt: string;
  adminReply?: string;
}
