interface StructuredError {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
}

export function getUserFacingError(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') return fallback;

  const details = error as StructuredError;
  const code = typeof details.code === 'string' ? details.code.toLowerCase() : '';
  const name = typeof details.name === 'string' ? details.name.toLowerCase() : '';
  const status = typeof details.status === 'number' ? details.status : 0;
  const message = typeof details.message === 'string' ? details.message : '';
  const normalizedMessage = message.toLowerCase();

  if (code === 'invalid_credentials' || normalizedMessage.includes('invalid login credentials')) {
    return 'The email or password is incorrect. Check your details or use Forgot password to reset your password.';
  }
  if (code === 'email_not_confirmed' || normalizedMessage.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in.';
  }
  if (['user_already_exists', 'email_exists'].includes(code)
    || normalizedMessage.includes('user already registered')) {
    return 'An account with this email already exists. Sign in or use Forgot password to recover it.';
  }
  if (code === 'weak_password' || normalizedMessage.includes('password should be')) {
    return 'Choose a stronger password that meets the password requirements.';
  }
  if (code === 'over_request_rate_limit' || status === 429) {
    return 'Too many attempts. Wait a few minutes and try again.';
  }
  if (code === '23505') {
    return 'This information already exists. Check your entry and try again.';
  }
  if (code === '42501' || normalizedMessage.includes('row-level security')) {
    return 'You do not have permission to complete this action. Sign in with the appropriate account and try again.';
  }
  if (code === 'pgrst116') {
    return 'The requested record could not be found.';
  }
  if (status === 401 || code === 'jwt_expired' || code === 'session_not_found') {
    return 'Your session has expired. Sign in again and retry.';
  }
  if (name === 'typeerror' && /fetch|network|connection/.test(normalizedMessage)) {
    return 'Unable to connect right now. Check your internet connection and try again.';
  }

  const isSupabaseError = Boolean(code)
    || name.includes('authapierror')
    || name.includes('postgresterror')
    || name.includes('functionshttperror')
    || name.includes('functionsfetcherror');
  return isSupabaseError ? fallback : message || fallback;
}
