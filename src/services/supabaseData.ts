import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase.ts';
import type { Announcement, CouncilMember, EventRegistration } from '../types/index.ts';
import { generateUuid } from '../utils/uuid.ts';

export type PortalCollection =
  | 'programs'
  | 'events'
  | 'announcements'
  | 'applications'
  | 'transparencyDocs'
  | 'council'
  | 'feedbacks'
  | 'registrations'
  | 'services';

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
const MAX_TRANSPARENCY_DOCUMENT_SIZE = 25 * 1024 * 1024;

export interface PortalRecord {
  id: string;
}

interface PortalRow {
  id: string;
  data: PortalRecord;
}

function getClient() {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env.local.');
  return supabase;
}

export async function uploadPortalImage(file: File, folder: 'announcements' | 'council'): Promise<string> {
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

export async function uploadTransparencyDocument(file: File, documentId: string): Promise<string> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Choose a PDF file.');
  }
  if (file.size > MAX_TRANSPARENCY_DOCUMENT_SIZE) {
    throw new Error('PDF files must be 25 MB or smaller.');
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
  const { error } = await getClient().functions.invoke('send-feedback-reply', {
    body: { feedbackId, reply },
  });

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
  onError: (error: Error) => void
): () => void {
  const client = getClient();
  let isActive = true;
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
