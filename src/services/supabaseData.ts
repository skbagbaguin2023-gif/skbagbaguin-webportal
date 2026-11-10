import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase.ts';
import type {
  Announcement,
  CouncilMember,
  EventRegistration,
  KkAdminResponse,
  KkAggregateReport,
  KkResponseStatus,
  KkProfilingData,
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

  const path = `submissions/${generateUuid()}/${generateUuid()}.${extension}`;
  const { error } = await getClient().storage
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

  const path = `printing-requests/${generateUuid()}/${generateUuid()}.pdf`;
  const { error } = await getClient().storage
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

export async function submitKkProfile(
  profile: KkProfilingData & { privacyConsent: true; privacyNoticeVersion: string }
): Promise<{ applicationId: string; refNumber: string }> {
  const { data, error } = await getClient().functions.invoke('submit-kk-profile', {
    body: { profile },
  });

  if (error) {
    const context = error.context;
    if (context instanceof Response) {
      try {
        const result = await context.clone().json() as { error?: unknown };
        if (typeof result.error === 'string') throw new Error(result.error);
      } catch (responseError) {
        if (responseError instanceof Error && responseError.message !== 'Unexpected end of JSON input') {
          throw responseError;
        }
      }
    }
    throw new Error(`The KK profile could not be saved. ${error.message}`);
  }
  if (
    typeof data?.applicationId !== 'string'
    || typeof data?.refNumber !== 'string'
  ) {
    throw new Error('The KK profile could not be confirmed as saved.');
  }
  return { applicationId: data.applicationId, refNumber: data.refNumber };
}

export async function checkKkRegistrationStatus(
  refNumber: string,
  identifier: string
): Promise<'pending' | 'verified' | 'needs_review' | 'rejected' | 'not_found'> {
  const { data, error } = await getClient().functions.invoke('check-kk-registration', {
    body: { refNumber, identifier },
  });
  if (error) {
    const context = error.context;
    if (context instanceof Response) {
      try {
        const result = await context.clone().json() as { error?: unknown };
        if (typeof result.error === 'string') throw new Error(result.error);
      } catch (responseError) {
        if (responseError instanceof Error && responseError.message !== 'Unexpected end of JSON input') {
          throw responseError;
        }
      }
    }
    throw new Error(`Registration status could not be checked. ${error.message}`);
  }
  if (
    data?.status !== 'pending'
    && data?.status !== 'verified'
    && data?.status !== 'needs_review'
    && data?.status !== 'rejected'
    && data?.status !== 'not_found'
  ) {
    throw new Error('Registration status could not be confirmed.');
  }
  return data.status;
}

export async function fetchKkResponses(options: {
  status: KkResponseStatus | '';
  search: string;
  limit: number;
  offset: number;
}): Promise<{ responses: KkAdminResponse[]; totalCount: number }> {
  const { data, error } = await getClient().rpc('get_kk_responses', {
    p_status: options.status || null,
    p_search: options.search.trim(),
    p_limit: options.limit,
    p_offset: options.offset,
  });
  if (error) throw new Error(`KK responses could not be loaded. ${error.message}`);
  if (!Array.isArray(data)) throw new Error('KK responses could not be confirmed.');

  const rows = data as Array<{ response?: KkAdminResponse; total_count?: number }>;
  return {
    responses: rows.flatMap((row) => row.response ? [row.response] : []),
    totalCount: Number(rows[0]?.total_count ?? 0),
  };
}

export async function fetchKkAggregateReport(): Promise<KkAggregateReport> {
  const { data, error } = await getClient().rpc('get_kk_aggregate_report');
  if (error) throw new Error(`KK aggregate report could not be loaded. ${error.message}`);
  if (!data || typeof data !== 'object' || !('pending' in data)) {
    throw new Error('KK aggregate report could not be confirmed.');
  }
  return data as KkAggregateReport;
}

export async function reviewKkResponse(
  responseId: string,
  status: KkResponseStatus,
  reviewNotes: string
): Promise<void> {
  const { error } = await getClient().rpc('review_kk_response', {
    p_response_id: responseId,
    p_status: status,
    p_review_notes: reviewNotes,
  });
  if (error) throw new Error(`KK response could not be updated. ${error.message}`);
}

export async function exportKkResponsesCsv(purpose: string): Promise<string> {
  const { data, error } = await getClient().rpc('export_kk_responses_csv', {
    p_purpose: purpose.trim(),
  });
  if (error) throw new Error(`KK response export failed. ${error.message}`);
  if (typeof data !== 'string' || !data.startsWith('id,source,')) {
    throw new Error('KK response export could not be confirmed.');
  }
  return data;
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
