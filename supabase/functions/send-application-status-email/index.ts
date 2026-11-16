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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character] ?? character);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed.' });

  const authorization = request.headers.get('Authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return jsonResponse(401, { error: 'Administrator sign-in is required.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const mailerUrl = Deno.env.get('GMAIL_MAILER_URL');
  const mailerSecret = Deno.env.get('GMAIL_MAILER_SECRET');
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !mailerUrl || !mailerSecret) {
    console.error('Application status email is not configured: one or more required server secrets are missing.');
    return jsonResponse(503, { error: 'Application status email is not configured.' });
  }

  let mailerEndpoint: URL;
  try {
    mailerEndpoint = new URL(mailerUrl);
  } catch {
    return jsonResponse(503, { error: 'The Gmail mailer URL is invalid.' });
  }
  if (mailerEndpoint.protocol !== 'https:'
    || mailerEndpoint.hostname !== 'script.google.com'
    || !mailerEndpoint.pathname.startsWith('/macros/s/')) {
    return jsonResponse(503, { error: 'The Gmail mailer URL is invalid.' });
  }

  let body: { applicationId?: unknown; status?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid request body.' });
  }
  const applicationId = typeof body.applicationId === 'string' ? body.applicationId : '';
  const requestedStatus = typeof body.status === 'string' ? body.status : '';
  if (!/^app-[0-9a-f-]{36}$/i.test(applicationId)
    || !['Pending', 'Under Review', 'Approved', 'Rejected', 'Cancelled'].includes(requestedStatus)) {
    return jsonResponse(400, { error: 'A valid application and status are required.' });
  }

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return jsonResponse(401, { error: 'Your administrator session is invalid or expired.' });
  const { data: isAdmin, error: adminError } = await authClient.rpc('is_portal_admin');
  if (adminError || !isAdmin) return jsonResponse(403, { error: 'Administrator access is required.' });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: row, error: recordError } = await adminClient
    .from('portal_records')
    .select('data, owner_user_id')
    .eq('collection', 'applications')
    .eq('id', applicationId)
    .maybeSingle();
  if (recordError) {
    console.error('Unable to load application for status email.', recordError);
    return jsonResponse(500, { error: 'Could not load the saved application.' });
  }
  if (!row || !row.owner_user_id || !row.data || typeof row.data !== 'object') {
    return jsonResponse(200, { sent: false, reason: 'no-linked-account' });
  }

  const application = row.data as { refNumber?: unknown; status?: unknown };
  if (application.status !== requestedStatus) {
    return jsonResponse(409, { error: 'The application status changed. Refresh and try again.' });
  }

  const { data: preference, error: preferenceError } = await adminClient
    .from('resident_preferences')
    .select('status_email_opt_in')
    .eq('user_id', row.owner_user_id)
    .maybeSingle();
  if (preferenceError) {
    console.error('Unable to load resident email preference.', preferenceError);
    return jsonResponse(500, { error: 'Could not load the resident notification preference.' });
  }
  if (!preference?.status_email_opt_in) return jsonResponse(200, { sent: false, reason: 'not-opted-in' });

  const { data: resident, error: residentError } = await adminClient.auth.admin.getUserById(row.owner_user_id);
  if (residentError || !resident.user?.email || !resident.user.email_confirmed_at) {
    return jsonResponse(200, { sent: false, reason: 'no-verified-email' });
  }

  const reference = typeof application.refNumber === 'string' ? application.refNumber : 'your request';
  const status = requestedStatus;
  const subject = `SK Bagbaguin application update: ${reference}`;
  const text = `Your SK Bagbaguin application ${reference} status has changed to ${status}. Sign in to your resident account to see the latest details.`;
  const html = [
    '<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6;max-width:640px;margin:auto">',
    '<div style="background:#0f2c59;color:#fff;padding:20px 24px">',
    '<div style="font-size:12px;color:#f5a623;font-weight:bold;letter-spacing:.04em">SANGGUNIANG KABATAAN NG BARANGAY BAGBAGUIN</div>',
    '<h1 style="font-size:20px;margin:8px 0 0">Application status update</h1>',
    '</div>',
    `<div style="padding:24px"><p>Your application status has changed.</p><p><strong>Reference:</strong> ${escapeHtml(reference)}<br><strong>Status:</strong> ${escapeHtml(status)}</p>`,
    '<p>Sign in to your resident account to view the latest details.</p>',
    '<p style="margin-top:28px">Respectfully,<br><strong>SK Bagbaguin Youth Council</strong></p>',
    '</div></div>',
  ].join('');

  let mailerResponse: Response;
  try {
    mailerResponse = await fetch(mailerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'application_status_update',
        token: mailerSecret,
        to: resident.user.email,
        subject,
        text,
        html,
      }),
    });
  } catch (error) {
    console.error('Unable to reach Gmail mailer.', error);
    return jsonResponse(502, { error: 'The status was saved, but the Gmail mailer could not be reached.' });
  }

  let mailerResult: { ok?: boolean; error?: string };
  try {
    mailerResult = await mailerResponse.json();
  } catch (error) {
    console.error('Gmail mailer returned invalid JSON.', error);
    return jsonResponse(502, { error: 'The status was saved, but the Gmail mailer returned an invalid response.' });
  }
  if (!mailerResponse.ok || mailerResult.ok !== true) {
    console.error('Gmail mailer rejected the status email.', mailerResult.error ?? mailerResponse.status);
    return jsonResponse(502, { error: 'The status was saved, but Gmail could not send the email.' });
  }

  return jsonResponse(200, { sent: true });
});
