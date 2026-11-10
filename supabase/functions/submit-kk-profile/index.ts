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

async function getRateLimitKey(request: Request, prefix: string, secret: string): Promise<string | null> {
  const forwardedIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? forwardedIp;
  if (!ip) return null;

  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${secret}:${ip}`)
  );
  const fingerprint = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `${prefix}:${fingerprint}`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('KK registration is not configured.');
    return jsonResponse(503, { error: 'KK registration is temporarily unavailable.' });
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > 20_000) return jsonResponse(413, { error: 'The submitted profile is too large.' });

  let body: { profile?: unknown };
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).length > 20_000) {
      return jsonResponse(413, { error: 'The submitted profile is too large.' });
    }
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, { error: 'Invalid request body.' });
  }
  if (!body.profile || typeof body.profile !== 'object' || Array.isArray(body.profile)) {
    return jsonResponse(400, { error: 'A valid KK profile is required.' });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const rateKey = await getRateLimitKey(request, 'kk-register', serviceRoleKey);
  if (!rateKey) return jsonResponse(400, { error: 'The request could not be verified.' });

  const { data: allowed, error: rateError } = await adminClient.rpc('check_rate_limit', {
    key: rateKey,
    max_count: 5,
    window_seconds: 3600,
  });
  if (rateError) {
    console.error('KK registration rate-limit check failed.', rateError.code);
    return jsonResponse(503, { error: 'KK registration is temporarily unavailable.' });
  }
  if (allowed !== true) return jsonResponse(429, { error: 'Too many registration attempts. Try again later.' });

  const { data, error } = await adminClient.rpc('submit_kk_profile', {
    p_profile: body.profile,
  });
  if (error) {
    return jsonResponse(400, { error: error.message || 'The KK profile could not be saved.' });
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.application_id || !result?.ref_number) {
    console.error('KK registration returned an invalid result.');
    return jsonResponse(500, { error: 'The KK profile could not be confirmed as saved.' });
  }

  return jsonResponse(200, {
    applicationId: result.application_id,
    refNumber: result.ref_number,
    status: 'pending',
    message: 'Your registration was received. The SK office will review it.',
  });
});
