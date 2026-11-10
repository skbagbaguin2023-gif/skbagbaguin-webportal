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

async function rateLimitKey(request: Request, secret: string): Promise<string | null> {
  const ip = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (!ip) return null;
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${secret}:${ip}`)
  );
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `kk-status:${hash}`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('KK status lookup is not configured.');
    return jsonResponse(503, { error: 'Registration status is temporarily unavailable.' });
  }

  let body: { refNumber?: unknown; identifier?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid request body.' });
  }
  const refNumber = typeof body.refNumber === 'string' ? body.refNumber.trim() : '';
  const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
  if (!refNumber || refNumber.length > 64 || !identifier || identifier.length > 254) {
    return jsonResponse(400, { error: 'Enter the registration reference and the email or phone used to register.' });
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const key = await rateLimitKey(request, serviceRoleKey);
  if (!key) return jsonResponse(400, { error: 'The request could not be verified.' });

  const { data: allowed, error: rateError } = await client.rpc('check_rate_limit', {
    key,
    max_count: 12,
    window_seconds: 3600,
  });
  if (rateError) {
    console.error('KK status rate-limit check failed.', rateError.code);
    return jsonResponse(503, { error: 'Registration status is temporarily unavailable.' });
  }
  if (allowed !== true) return jsonResponse(429, { error: 'Too many status checks. Try again later.' });

  const { data: status, error } = await client.rpc('check_kk_registration_status', {
    p_ref_number: refNumber,
    p_identifier: identifier,
  });
  if (error) {
    console.error('KK status lookup failed.', error.code);
    return jsonResponse(503, { error: 'Registration status is temporarily unavailable.' });
  }

  return jsonResponse(200, {
    status: typeof status === 'string' ? status : 'not_found',
  });
});
