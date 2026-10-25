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
  if (!token) return jsonResponse(401, { error: 'Sign in as an administrator to send replies.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const mailerUrl = Deno.env.get('GMAIL_MAILER_URL');
  const mailerSecret = Deno.env.get('GMAIL_MAILER_SECRET');
  if (!supabaseUrl || !supabaseAnonKey || !mailerUrl || !mailerSecret) {
    console.error('Feedback email is not configured: one or more required server secrets are missing.');
    return jsonResponse(503, { error: 'Email sending is not configured yet. Ask an administrator to finish the Gmail setup.' });
  }
  try {
    const mailerEndpoint = new URL(mailerUrl);
    if (
      mailerEndpoint.protocol !== 'https:'
      || mailerEndpoint.hostname !== 'script.google.com'
      || !mailerEndpoint.pathname.startsWith('/macros/s/')
    ) {
      return jsonResponse(503, { error: 'The Gmail mailer URL is invalid. Use the deployed Google Apps Script web app URL.' });
    }
  } catch {
    return jsonResponse(503, { error: 'The Gmail mailer URL is invalid. Use the deployed Google Apps Script web app URL.' });
  }

  let body: { feedbackId?: unknown; reply?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid request body.' });
  }

  const feedbackId = typeof body.feedbackId === 'string' ? body.feedbackId : '';
  const reply = typeof body.reply === 'string' ? body.reply.trim() : '';
  if (!feedbackId || !reply || reply.length > 5000) {
    return jsonResponse(400, { error: 'A feedback message ID and reply of 1 to 5000 characters are required.' });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return jsonResponse(401, { error: 'Your administrator session is invalid or expired.' });

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_portal_admin');
  if (adminError || !isAdmin) return jsonResponse(403, { error: 'Administrator access is required to send council replies.' });

  const { data: row, error: recordError } = await supabase
    .from('portal_records')
    .select('data')
    .eq('collection', 'feedbacks')
    .eq('id', feedbackId)
    .maybeSingle();

  if (recordError) {
    console.error('Unable to load feedback record for email.', recordError);
    return jsonResponse(500, { error: 'Could not load the saved feedback message.' });
  }
  if (!row || !row.data || typeof row.data !== 'object') {
    return jsonResponse(404, { error: 'The feedback message could not be found.' });
  }

  const feedback = row.data as {
    email?: unknown;
    senderName?: unknown;
    subject?: unknown;
    adminReply?: unknown;
  };
  const recipient = typeof feedback.email === 'string' ? feedback.email.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    return jsonResponse(400, { error: 'This feedback has no valid recipient email address. The reply remains saved in the inbox.' });
  }
  if (feedback.adminReply !== reply) {
    return jsonResponse(409, { error: 'The saved reply changed. Save it again before sending.' });
  }

  const subject = `Official Council Action & Reply: ${String(feedback.subject ?? 'Youth suggestion')}`
    .replace(/[\r\n]/g, ' ');
  const senderName = typeof feedback.senderName === 'string' ? feedback.senderName : 'Kabataan ng Bagbaguin';
  const html = [
    '<div style="font-family:Arial,sans-serif;color:#172033;line-height:1.6;max-width:640px;margin:auto">',
    '<div style="background:#0f2c59;color:#fff;padding:20px 24px">',
    '<div style="font-size:12px;color:#f5a623;font-weight:bold;letter-spacing:.04em">SANGGUNIANG KABATAAN NG BARANGAY BAGBAGUIN</div>',
    '<h1 style="font-size:20px;margin:8px 0 0">Official Council Action &amp; Reply</h1>',
    '</div>',
    `<div style="padding:24px"><p>Good day ${escapeHtml(senderName)},</p>`,
    `<p>Regarding your message: <strong>${escapeHtml(String(feedback.subject ?? 'Youth suggestion'))}</strong></p>`,
    `<div style="background:#f4f6fa;border-left:4px solid #f5a623;padding:16px;margin:20px 0;white-space:pre-wrap">${escapeHtml(reply)}</div>`,
    '<p>Thank you for reaching out to the Sangguniang Kabataan ng Barangay Bagbaguin.</p>',
    '<p style="margin-top:28px">Respectfully,<br><strong>SK Bagbaguin Youth Council</strong><br>Sangguniang Kabataan ng Barangay Bagbaguin</p>',
    '</div><hr style="border:0;border-top:1px solid #e5e7eb">',
    '<p style="padding:0 24px 16px;color:#667085;font-size:11px">This email contains an official response to a message submitted through the SK Bagbaguin Youth Portal.</p>',
    '</div>',
  ].join('');

  let mailerResponse: Response;
  try {
    mailerResponse = await fetch(mailerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: mailerSecret,
        to: recipient,
        senderName,
        subject,
        reply,
        html,
      }),
    });
  } catch (error) {
    console.error('Unable to reach Gmail mailer.', error);
    return jsonResponse(502, { error: 'The reply was saved, but the Gmail mailer could not be reached.' });
  }

  let mailerResult: { ok?: boolean; error?: string };
  try {
    mailerResult = await mailerResponse.json();
  } catch (error) {
    console.error('Gmail mailer returned invalid JSON.', error);
    return jsonResponse(502, { error: 'The reply was saved, but the Gmail mailer returned an invalid response.' });
  }
  if (!mailerResponse.ok || mailerResult.ok !== true) {
    console.error('Gmail mailer rejected the reply.', mailerResult.error ?? mailerResponse.status);
    return jsonResponse(502, {
      error: 'The reply was saved, but Gmail could not send it. Check the Google Apps Script deployment and sender account.',
    });
  }

  return jsonResponse(200, { emailSent: true });
});
