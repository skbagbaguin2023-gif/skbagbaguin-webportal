import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function isValidKkProfile(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const profile = value as Record<string, unknown>;
  const requiredStrings = [
    'email', 'firstName', 'middleName', 'lastName', 'genderIdentity', 'birthday',
    'birthplace', 'contactNumber', 'civilStatus', 'sitioAddress', 'completeAddress',
    'voterStatus', 'votedLastSkElection', 'skElectionVoteCount', 'nationalVoter',
    'workStatus', 'educationalBackground',
  ];
  if (requiredStrings.some((key) => typeof profile[key] !== 'string' || !(profile[key] as string).trim())) {
    return false;
  }
  if (
    typeof profile.age !== 'number'
    || !Number.isInteger(profile.age)
    || profile.age < 15
    || profile.age > 30
    || typeof profile.youthClassifications !== 'object'
    || !Array.isArray(profile.youthClassifications)
    || profile.youthClassifications.length === 0
    || !profile.youthClassifications.every((item) => typeof item === 'string')
  ) {
    return false;
  }
  const email = profile.email as string;
  const phone = (profile.contactNumber as string).replace(/[\s-]/g, '');
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && /^(09\d{9}|\+639\d{9})$/.test(phone)
    && /^\d{4}-\d{2}-\d{2}$/.test(profile.birthday as string);
}

async function saveSyncStatus(
  client: ReturnType<typeof createClient>,
  applicationId: string,
  record: Record<string, unknown>,
  status: 'Failed' | 'Synced',
  syncError = ''
) {
  const { error } = await client.from('portal_records').update({
    data: { ...record, googleSyncStatus: status, googleSyncError: syncError },
    updated_at: new Date().toISOString(),
  }).eq('collection', 'applications').eq('id', applicationId);
  if (error) console.error(`Unable to save KK Google sync status (${status}).`, error);
  return !error;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const googleWebAppUrl = Deno.env.get('KK_FORM_WEB_APP_URL');
  const googleSyncSecret = Deno.env.get('KK_FORM_SYNC_SECRET');
  if (!supabaseUrl || !serviceRoleKey || !googleWebAppUrl || !googleSyncSecret) {
    console.error('KK Google sync is not configured: one or more required server secrets are missing.');
    return jsonResponse(503, { error: 'Google Form synchronization is not configured yet.' });
  }

  try {
    const endpoint = new URL(googleWebAppUrl);
    if (
      endpoint.protocol !== 'https:'
      || endpoint.hostname !== 'script.google.com'
      || !endpoint.pathname.startsWith('/macros/s/')
      || !endpoint.pathname.endsWith('/exec')
    ) {
      return jsonResponse(503, { error: 'The KK Google Apps Script deployment URL is invalid.' });
    }
  } catch {
    return jsonResponse(503, { error: 'The KK Google Apps Script deployment URL is invalid.' });
  }

  let body: { applicationId?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid request body.' });
  }

  const applicationId = typeof body.applicationId === 'string' ? body.applicationId : '';
  if (!/^app-[0-9a-f-]{36}$/i.test(applicationId)) {
    return jsonResponse(400, { error: 'A valid KK portal application ID is required.' });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: row, error: loadError } = await adminClient
    .from('portal_records')
    .select('data')
    .eq('collection', 'applications')
    .eq('id', applicationId)
    .maybeSingle();

  if (loadError) {
    console.error('Unable to load saved KK profile for Google sync.', loadError);
    return jsonResponse(500, { error: 'Could not load the saved KK profile.' });
  }
  if (!row?.data || typeof row.data !== 'object') {
    return jsonResponse(404, { error: 'The saved KK profile could not be found.' });
  }

  const profileRecord = row.data as {
    serviceType?: unknown;
    kkProfile?: unknown;
    googleSyncStatus?: unknown;
  };
  if (
    typeof profileRecord.serviceType !== 'string'
    || !profileRecord.serviceType.toLowerCase().includes('profiling')
    || !isValidKkProfile(profileRecord.kkProfile)
  ) {
    return jsonResponse(400, { error: 'The saved record is not a complete KK profiling submission.' });
  }
  if (profileRecord.googleSyncStatus === 'Synced') {
    return jsonResponse(200, { synced: true, alreadySynced: true });
  }

  let googleResponse: Response;
  try {
    googleResponse = await fetch(googleWebAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_kk_profile',
        token: googleSyncSecret,
        portalId: applicationId,
        profile: profileRecord.kkProfile,
      }),
      redirect: 'follow',
    });
  } catch (error) {
    console.error('Unable to reach the KK Google Apps Script.', error);
    await saveSyncStatus(
      adminClient,
      applicationId,
      row.data,
      'Failed',
      'Google Apps Script could not be reached.'
    );
    return jsonResponse(502, { error: 'Profile is saved in the portal, but Google Apps Script could not be reached.' });
  }

  let result: { ok?: unknown; error?: unknown };
  try {
    result = await googleResponse.json();
  } catch (error) {
    console.error('KK Google Apps Script returned invalid JSON.', error);
    await saveSyncStatus(
      adminClient,
      applicationId,
      row.data,
      'Failed',
      'Google Apps Script returned an invalid response.'
    );
    return jsonResponse(502, { error: 'Profile is saved in the portal, but Google returned an invalid response.' });
  }

  if (!googleResponse.ok || result.ok !== true) {
    const safeError = typeof result.error === 'string'
      ? result.error.slice(0, 300)
      : 'Google Forms rejected the response.';
    await saveSyncStatus(adminClient, applicationId, row.data, 'Failed', safeError);
    return jsonResponse(502, { error: `Profile is saved in the portal, but Google sync failed: ${safeError}` });
  }

  const statusSaved = await saveSyncStatus(adminClient, applicationId, row.data, 'Synced');
  if (!statusSaved) {
    console.error('Google sync succeeded but portal sync status could not be updated.');
    return jsonResponse(200, { synced: true, statusSaved: false });
  }

  return jsonResponse(200, { synced: true });
});
