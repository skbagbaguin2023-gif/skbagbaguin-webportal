export type UserRole = 'resident' | 'admin';

export type PublicPage = 
  | 'home' 
  | 'about' 
  | 'programs' 
  | 'events' 
  | 'announcements' 
  | 'facebookPosts'
  | 'services'
  | 'transparency' 
  | 'contact';

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
  | 'services';

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
  postUrl: string;
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
export type ApplicationStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

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
