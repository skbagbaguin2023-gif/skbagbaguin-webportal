import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase.ts';
import type {
  Announcement,
  ApplicationStatus,
  CouncilMember,
  EventRegistration,
  YouthApplication,
} from '../types/index.ts';
import { generateUuid } from '../utils/uuid.ts';

export type PortalCollection =
  | 'programs'
  | 'programSettings'
  | 'events'
  | 'announcements'
  | 'facebookPosts'
  | 'applications'
  | 'transparencyDocs'
  | 'council'
  | 'feedbacks'
  | 'registrations'
  | 'services'
  | 'maintenance';

const PORTAL_IMAGES_BUCKET = 'portal-images';
const MAX_PORTAL_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const DOCUMENT_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};
const APPLICATION_DOCUMENTS_BUCKET = 'application-documents';
const MAX_APPLICATION_DOCUMENT_SIZE = 10 * 1024 * 1024;
const TRANSPARENCY_DOCUMENTS_BUCKET = 'transparency-documents';
const MAX_TRANSPARENCY_DOCUMENT_SIZE = 35 * 1024 * 1024;

export interface PortalRecord {
  id: string;
}

export interface ApplicationTrackingResult {
  refNumber: string;
  applicantName: string;
  serviceType: string;
  status: string;
  submittedAt: string;
  requestedDate?: string;
  dateNeeded?: string;
  copiesNeeded?: number;
  lastUpdated: string;
}

export interface ResidentApplication extends YouthApplication {
  updatedAt: string;
}

export interface ApplicationEditHistory {
  id: string;
  application_id: string;
  reason: string;
  changed_fields: string[];
  created_at: string;
}

export interface ResidentApplicationClaim {
  id: string;
  ref_number: string;
  contact_number: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

export interface AdminApplicationClaim extends ResidentApplicationClaim {
  resident_user_id: string;
  resident_email: string;
}

export interface ResidentPreferences {
  statusEmailOptIn: boolean;
}

interface PortalRow {
  id: string;
  data: PortalRecord;
}

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.');
  return supabase;
}

export async function uploadPortalImage(file: File, folder: 'announcements' | 'council' | 'programs'): Promise<string> {
  const extension = IMAGE_EXTENSIONS[file.type];
  if (!extension) throw new Error('Choose a JPG, PNG, or WebP image.');
  if (file.size > MAX_PORTAL_IMAGE_SIZE) throw new Error('Image must be 5 MB or smaller.');

  const client = getClient();
  const path = `${folder}/${generateUuid()}.${extension}`;
  const { error } = await client.storage
    .from(PORTAL_IMAGES_BUCKET)
    .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });

  if (error) throw error;
  return client.storage.from(PORTAL_IMAGES_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function deletePortalImage(publicUrl: string): Promise<void> {
  const client = getClient();
  const imageUrl = new URL(publicUrl);
  const bucketPublicUrl = new URL(
    client.storage.from(PORTAL_IMAGES_BUCKET).getPublicUrl('').data.publicUrl
  );
  const prefix = `/storage/v1/object/public/${PORTAL_IMAGES_BUCKET}/`;

  if (imageUrl.origin !== bucketPublicUrl.origin || !imageUrl.pathname.startsWith(prefix)) return;

  const path = decodeURIComponent(imageUrl.pathname.slice(prefix.length));
  if (!path) return;

  const { error } = await client.storage.from(PORTAL_IMAGES_BUCKET).remove([path]);
  if (error) throw error;
}

export async function uploadApplicationDocument(file: File): Promise<string> {
  const extension = DOCUMENT_EXTENSIONS[file.type];
  if (!extension) throw new Error('Choose a PDF, JPG, or PNG document.');
  if (file.size > MAX_APPLICATION_DOCUMENT_SIZE) throw new Error('Each document must be 10 MB or smaller.');

  const client = getClient();
  const { data: { session } } = await client.auth.getSession();
  const folder = session?.user.id ?? generateUuid();
  const path = `submissions/${folder}/${generateUuid()}.${extension}`;
  const { error } = await client.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });

  if (error) throw error;
  return path;
}

export async function uploadPrintingRequestPdf(file: File): Promise<string> {
  if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Choose a PDF file.');
  }
  if (file.size === 0) throw new Error('The selected PDF file is empty.');
  if (file.size > MAX_APPLICATION_DOCUMENT_SIZE) {
    throw new Error('The PDF must be 10 MB or smaller.');
  }

  const client = getClient();
  const { data: { session } } = await client.auth.getSession();
  const folder = session?.user.id ?? generateUuid();
  const path = `printing-requests/${folder}/${generateUuid()}.pdf`;
  const { error } = await client.storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) throw error;
  return path;
}

export async function getApplicationDocumentSignedUrl(path: string): Promise<string> {
  const { data, error } = await getClient().storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteApplicationDocument(path: string): Promise<void> {
  if (!/^(submissions|printing-requests)\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(pdf|jpg|png)$/i.test(path)) {
    throw new Error('Invalid application document storage path.');
  }

  const { error } = await getClient().storage
    .from(APPLICATION_DOCUMENTS_BUCKET)
    .remove([path]);

  if (error) throw error;
}

export async function uploadTransparencyDocument(file: File, documentId: string): Promise<string> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Choose a PDF file.');
  }
  const pdfHeader = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (pdfHeader !== '%PDF-') throw new Error('The selected file is not a valid PDF document.');
  if (file.size > MAX_TRANSPARENCY_DOCUMENT_SIZE) {
    throw new Error('PDF files must be 35 MB or smaller.');
  }
  if (file.size === 0) throw new Error('The selected PDF file is empty.');

  const path = `reports/${documentId}/${generateUuid()}.pdf`;
  const { error } = await getClient().storage
    .from(TRANSPARENCY_DOCUMENTS_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) throw error;
  return path;
}

export async function deleteTransparencyDocument(path: string): Promise<void> {
  if (!path.startsWith('reports/')) throw new Error('Invalid transparency document storage path.');
  const { error } = await getClient().storage
    .from(TRANSPARENCY_DOCUMENTS_BUCKET)
    .remove([path]);
  if (error) throw error;
}

export async function getTransparencyDocumentSignedUrl(path: string): Promise<string> {
  const { data, error } = await getClient().storage
    .from(TRANSPARENCY_DOCUMENTS_BUCKET)
    .createSignedUrl(path, 60);
  if (error) throw error;
  return data.signedUrl;
}

export async function sendFeedbackReplyEmail(feedbackId: string, reply: string): Promise<void> {
  const client = getClient();
  const getValidSession = async () => {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      throw new Error(`Reply saved, but the administrator session could not be checked. ${sessionError.message}`);
    }

    let session = sessionData.session;
    const sessionExpiresSoon = !session?.expires_at
      || session.expires_at * 1000 <= Date.now() + 60_000;
    if (sessionExpiresSoon) {
      const { data: refreshedSessionData, error: refreshError } = await client.auth.refreshSession();
      if (refreshError || !refreshedSessionData.session) return null;
      session = refreshedSessionData.session;
    }
    if (!session) return null;

    const { data: userData, error: userError } = await client.auth.getUser(session.access_token);
    if (!userError && userData.user) return session;

    const { data: refreshedSessionData, error: refreshError } = await client.auth.refreshSession();
    if (refreshError || !refreshedSessionData.session) return null;
    return refreshedSessionData.session;
  };

  let session = await getValidSession();
  if (!session) {
    throw new Error('Reply saved, but your administrator session is invalid or expired. Sign in again before sending the email.');
  }

  let { error } = await client.functions.invoke('send-feedback-reply', {
    body: { feedbackId, reply },
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error?.context instanceof Response && error.context.status === 401) {
    session = await getValidSession();
    if (!session) {
      throw new Error('Reply saved, but your administrator session is invalid or expired. Sign in again before sending the email.');
    }
    ({ error } = await client.functions.invoke('send-feedback-reply', {
      body: { feedbackId, reply },
      headers: { Authorization: `Bearer ${session.access_token}` },
    }));
  }

  if (error) {
    const context = error.context;
    if (context instanceof Response) {
      let responseMessage: string | undefined;
      try {
        const result = await context.clone().json() as { error?: unknown };
        if (typeof result.error === 'string') responseMessage = result.error;
      } catch {
        responseMessage = undefined;
      }
      if (responseMessage) throw new Error(`Reply saved, but the email could not be sent. ${responseMessage}`);
    }
    throw new Error(`Reply saved, but the email could not be sent. ${error.message}`);
  }
}

export async function syncKkProfileToGoogle(applicationId: string): Promise<void> {
  const { data, error } = await getClient().functions.invoke('sync-kk-profile', {
    body: { applicationId },
  });

  if (error) {
    const context = error.context;
    if (context instanceof Response) {
      let response: { error?: unknown } | undefined;
      try {
        response = await context.clone().json() as { error?: unknown };
      } catch {
        response = undefined;
      }
      if (typeof response?.error === 'string') throw new Error(response.error);
    }
    throw new Error(`KK profile saved in the portal, but Google sync failed: ${error.message}`);
  }
  if (!data?.synced || data.statusSaved === false) {
    throw new Error('Google form sync could not be confirmed. The portal profile remains saved and can be retried.');
  }
}

export async function initializePortalDefaults(
  announcements: Announcement[],
  council: CouncilMember[]
): Promise<void> {
  const client = getClient();
  const records = [
    ...announcements.map((data) => ({ collection: 'announcements' as const, id: data.id, data })),
    ...council.map((data) => ({ collection: 'council' as const, id: data.id, data })),
  ];
  const { error } = await client
    .from('portal_records')
    .upsert(records, { onConflict: 'collection,id', ignoreDuplicates: true });

  if (error) throw error;
}

export async function saveCouncilOrder(council: CouncilMember[]): Promise<CouncilMember[]> {
  const orderedCouncil = council.map((member, sortOrder) => ({ ...member, sortOrder }));
  const { error } = await getClient()
    .from('portal_records')
    .upsert(
      orderedCouncil.map((data) => ({ collection: 'council', id: data.id, data })),
      { onConflict: 'collection,id' }
    );

  if (error) throw error;
  return orderedCouncil;
}

async function loadCollection<T extends PortalRecord>(
  name: PortalCollection,
  onData: (records: T[]) => void,
  onError: (error: Error) => void
): Promise<void> {
  const { data, error } = await getClient()
    .from('portal_records')
    .select('id,data')
    .eq('collection', name);

  if (error) {
    onError(error);
    return;
  }

  const records = (data as PortalRow[]).map((row) => ({ ...row.data, id: row.id }) as T);
  if (name === 'council') {
    records.sort((first, second) => {
      const firstOrder = 'sortOrder' in first && typeof first.sortOrder === 'number' ? first.sortOrder : Infinity;
      const secondOrder = 'sortOrder' in second && typeof second.sortOrder === 'number' ? second.sortOrder : Infinity;
      return firstOrder - secondOrder;
    });
  }
  onData(records);
}

export function subscribeToPortalCollection<T extends PortalRecord>(
  name: PortalCollection,
  onData: (records: T[]) => void,
  onError: (error: Error) => void,
  enableRealtime = true
): () => void {
  const client = getClient();
  let isActive = true;
  if (!enableRealtime) {
    void loadCollection<T>(
      name,
      (records) => {
        if (isActive) onData(records);
      },
      onError
    );
    return () => {
      isActive = false;
    };
  }

  const channel: RealtimeChannel = client
    .channel(`portal-${name}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'portal_records', filter: `collection=eq.${name}` },
      () => void loadCollection<T>(
        name,
        (records) => {
          if (isActive) onData(records);
        },
        onError
      )
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        void loadCollection<T>(
          name,
          (records) => {
            if (isActive) onData(records);
          },
          onError
        );
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError(error ?? new Error(`Supabase Realtime subscription failed for ${name}.`));
      }
    });

  return () => {
    isActive = false;
    void client.removeChannel(channel);
  };
}

export async function registerForEvent(
  eventId: string,
  registration: EventRegistration
): Promise<void> {
  const { error } = await getClient().rpc('register_for_event', {
    p_event_id: eventId,
    p_registration: registration,
  });

  if (error) {
    if (error.message.includes('EVENT_FULL')) throw new Error('This event has reached its registration limit.');
    if (error.message.includes('EVENT_NOT_FOUND')) throw new Error('This event is no longer available.');
    throw error;
  }
}

export async function savePortalRecord<T extends PortalRecord>(
  collection: PortalCollection,
  record: T
): Promise<void> {
  const { error } = await getClient()
    .from('portal_records')
    .upsert({ collection, id: record.id, data: record }, { onConflict: 'collection,id' });

  if (error) throw error;
}

export async function createPortalRecord<T extends PortalRecord>(
  collection: PortalCollection,
  record: T
): Promise<void> {
  const { error } = await getClient()
    .from('portal_records')
    .insert({ collection, id: record.id, data: record });

  if (error) throw error;
}

export async function findApplicationForTracking(
  refNumber: string,
  contactNumber: string
): Promise<ApplicationTrackingResult | null> {
  const { data, error } = await getClient().rpc('find_application_for_tracking', {
    p_ref_number: refNumber.trim().toUpperCase(),
    p_contact_number: contactNumber.replace(/[\s-]/g, ''),
  });

  if (error) throw error;
  const result = Array.isArray(data) ? data[0] : data;
  if (!result) return null;

  const row = result as {
    ref_number: string;
    applicant_name: string;
    service_type: string;
    status: string;
    submitted_at: string;
    requested_date?: string;
    date_needed?: string;
    copies_needed?: number;
    last_updated: string;
  };
  return {
    refNumber: row.ref_number,
    applicantName: row.applicant_name,
    serviceType: row.service_type,
    status: row.status,
    submittedAt: row.submitted_at,
    requestedDate: row.requested_date,
    dateNeeded: row.date_needed,
    copiesNeeded: row.copies_needed,
    lastUpdated: row.last_updated,
  };
}

export async function getResidentApplications(): Promise<ResidentApplication[]> {
  const client = getClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in to view your applications.');

  const { data, error } = await client
    .from('portal_records')
    .select('data, updated_at')
    .eq('collection', 'applications')
    .eq('owner_user_id', user.id)
    .order('updated_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...(row.data as YouthApplication),
    updatedAt: row.updated_at,
  }));
}

export function subscribeToResidentApplications(
  userId: string,
  onChange: () => void,
  onError: (error: Error) => void,
): () => void {
  const client = getClient();
  const channel: RealtimeChannel = client
    .channel(`resident-applications-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'portal_records', filter: 'collection=eq.applications' },
      onChange,
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError(error ?? new Error('Realtime application notifications could not be connected.'));
      }
    });

  return () => {
    void client.removeChannel(channel);
  };
}

export async function getApplicationEditHistory(applicationId?: string): Promise<ApplicationEditHistory[]> {
  let query = getClient()
    .from('application_edit_history')
    .select('id, application_id, reason, changed_fields, created_at')
    .order('created_at', { ascending: false });
  if (applicationId) query = query.eq('application_id', applicationId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function claimResidentApplications(): Promise<number> {
  const { data, error } = await getClient().rpc('claim_my_applications');
  if (error) throw error;
  return Number(data ?? 0);
}

export async function getResidentApplicationClaims(): Promise<ResidentApplicationClaim[]> {
  const { data, error } = await getClient()
    .from('resident_application_claims')
    .select('id, ref_number, contact_number, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function submitResidentApplicationClaim(
  refNumber: string,
  contactNumber: string,
): Promise<void> {
  const client = getClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in before requesting an application link.');

  const { error } = await client.from('resident_application_claims').insert({
    resident_user_id: user.id,
    ref_number: refNumber.trim(),
    contact_number: contactNumber.trim(),
  });
  if (error) {
    if (error.code === '23505') {
      throw new Error('A pending link request already exists for this reference number.');
    }
    throw error;
  }
}

export async function getPendingApplicationClaims(): Promise<AdminApplicationClaim[]> {
  const { data, error } = await getClient()
    .from('resident_application_claims')
    .select('id, resident_user_id, resident_email, ref_number, contact_number, status, created_at')
    .eq('status', 'Pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function reviewResidentApplicationClaim(
  claimId: string,
  approve: boolean,
): Promise<void> {
  const { error } = await getClient().rpc('review_resident_application_claim', {
    p_claim_id: claimId,
    p_approve: approve,
  });
  if (error) {
    const messages: Record<string, string> = {
      APPLICATION_NOT_MATCHED: 'No application matches both the reference number and contact number submitted.',
      APPLICATION_MATCH_NOT_UNIQUE: 'More than one application matches; resolve the duplicate records before linking.',
      APPLICATION_ALREADY_LINKED: 'This application is already linked to a different resident account.',
      CLAIM_ALREADY_REVIEWED: 'This link request has already been reviewed.',
      CLAIM_NOT_FOUND: 'This link request no longer exists.',
      ADMIN_REQUIRED: 'Only an administrator can review application link requests.',
    };
    const code = error.message.match(/(?:^|[\s:])([A-Z_]{5,})(?:$|[\s:])/i)?.[1];
    throw new Error((code && messages[code]) || error.message);
  }
}

export async function updateResidentApplication(
  application: YouthApplication,
  reason: string,
  removedDocumentPaths: string[],
): Promise<void> {
  const { error } = await getClient().rpc('update_my_application', {
    p_application_id: application.id,
    p_application: application,
    p_reason: reason,
    p_removed_document_paths: removedDocumentPaths,
  });
  if (error) throw error;
}

export async function cancelResidentApplication(applicationId: string, reason: string): Promise<void> {
  const { error } = await getClient().rpc('cancel_my_application', {
    p_application_id: applicationId,
    p_reason: reason,
  });
  if (error) throw error;
}

export async function getResidentPreferences(): Promise<ResidentPreferences> {
  const client = getClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in to manage your account preferences.');

  const { data, error } = await client
    .from('resident_preferences')
    .select('status_email_opt_in')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return { statusEmailOptIn: data?.status_email_opt_in ?? false };
}

export async function saveResidentPreferences(preferences: ResidentPreferences): Promise<void> {
  const client = getClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error('Sign in to manage your account preferences.');

  const { error } = await client.from('resident_preferences').upsert({
    user_id: user.id,
    status_email_opt_in: preferences.statusEmailOptIn,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function sendApplicationStatusEmail(
  applicationId: string,
  status: ApplicationStatus,
): Promise<{ sent: boolean; reason?: string }> {
  const { data, error } = await getClient().functions.invoke('send-application-status-email', {
    body: { applicationId, status },
  });
  if (error) throw error;
  return data as { sent: boolean; reason?: string };
}

export async function deletePortalRecord(
  collection: PortalCollection,
  id: string
): Promise<void> {
  const { error } = await getClient()
    .from('portal_records')
    .delete()
    .eq('collection', collection)
    .eq('id', id);

  if (error) throw error;
}
