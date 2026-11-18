import { useEffect, useState } from 'react';
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { supabase } from '../services/supabase.ts';
import { EMPTY_RESIDENT_PROFILE } from '../services/residentProfile.ts';
import type { ResidentProfile } from '../types/index.ts';
import skLogo from '../assets/images/skLogo.png';

type AuthMode = 'sign-in' | 'sign-up' | 'forgot-password' | 'reset-password';

const fieldClass = 'w-full rounded-xl border border-white/60 bg-white/80 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:border-[#0F2C59] focus:ring-2 focus:ring-[#0F2C59]/30';

export function ResidentAuthPanel({ onAuthenticated }: { onAuthenticated: () => void }) {
  const isRecoveryPage = window.location.pathname === '/reset-password'
    || new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
  const [mode, setMode] = useState<AuthMode>(() =>
    isRecoveryPage ? 'reset-password' : 'sign-in'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [profile, setProfile] = useState<ResidentProfile>({ ...EMPTY_RESIDENT_PROFILE });
  const [isLoading, setIsLoading] = useState(false);
  const [isRecoverySessionReady, setIsRecoverySessionReady] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let isActive = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset-password');
        setIsRecoverySessionReady(true);
        setError('');
      }
    });
    if (isRecoveryPage) {
      void supabase.auth.getSession().then(({ data, error: sessionError }) => {
        if (!isActive) return;
        if (sessionError) {
          setError('The password reset link could not be verified. Request a new reset email.');
        } else if (data.session) {
          setIsRecoverySessionReady(true);
        } else {
          setError('This password reset link is invalid or expired. Request a new reset email.');
        }
      }).catch(() => {
        if (isActive) setError('The password reset link could not be verified. Request a new reset email.');
      });
    }
    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [isRecoveryPage]);

  const updateProfile = (key: keyof ResidentProfile, value: string) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!supabase) {
      setError('Account sign-in is unavailable because Supabase is not configured.');
      return;
    }
    if (mode === 'reset-password' && !isRecoverySessionReady) {
      setError('Open a valid password reset link before choosing a new password.');
      return;
    }

    if ((mode === 'sign-up' || mode === 'reset-password')
      && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password)) {
      setError('Use at least 8 characters with an uppercase letter, a lowercase letter, a number, and a symbol.');
      return;
    }
    if ((mode === 'sign-up' || mode === 'reset-password') && password !== passwordConfirmation) {
      setError('The passwords do not match.');
      return;
    }
    if (mode === 'sign-up' && (!profile.firstName.trim() || !profile.lastName.trim()
      || !profile.contactNumber.trim() || !profile.sitioAddress.trim() || !profile.completeAddress.trim())) {
      setError('Complete your first name, last name, contact number, sitio, and address.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'sign-in') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (signInError) throw signInError;
        onAuthenticated();
      } else if (mode === 'sign-up') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { resident_profile: profile },
            emailRedirectTo: `${window.location.origin}/?page=account`,
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) onAuthenticated();
        else if (data.user?.identities?.length === 0) {
          setMode('sign-in');
          setPassword('');
          setMessage('An account with this email already exists. Sign in with its current password or use Forgot password? to reset it.');
        } else {
          setMode('sign-in');
          setPassword('');
          setMessage('No active sign-in session was returned. Check that email confirmation is disabled in Supabase, then sign in or use Forgot password? to recover the account.');
        }
      } else if (mode === 'forgot-password') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage('If an account exists for that email, a password reset link has been sent.');
      } else {
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setPassword('');
        setPasswordConfirmation('');
        setMode('sign-in');
        window.history.replaceState({}, '', `${window.location.pathname}?mode=resident`);
        setMessage('Your password has been updated. You can now sign in.');
        onAuthenticated();
      }
    } catch (requestError) {
      if (mode === 'sign-in'
        && requestError instanceof Error
        && 'code' in requestError
        && requestError.code === 'invalid_credentials') {
        setError('The email or password was not accepted. If you already created this account, use Forgot password? to set a new password.');
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Your account request could not be completed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const title = mode === 'sign-up' ? 'Create your account'
    : mode === 'forgot-password' ? 'Reset your password'
      : mode === 'reset-password' ? 'Choose a new password'
        : 'Welcome back';

  return (
    <section className={`mx-auto w-full rounded-3xl border border-white/60 bg-white/75 p-6 shadow-2xl shadow-[#071324]/20 backdrop-blur-2xl sm:p-8 ${mode === 'sign-up' ? 'max-w-3xl' : 'max-w-md'}`}>
      <header className="mb-6 flex flex-col items-center text-center">
        <img src={skLogo} alt="SK Bagbaguin" className="mb-3 h-14 w-14 rounded-2xl bg-white/80 object-contain p-1 shadow-sm" />
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose-700">SK Bagbaguin Resident Portal</p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          {mode === 'sign-up'
            ? 'Add your details to create your resident account and manage your service requests.'
            : mode === 'sign-in'
              ? 'Sign in to manage your requests and receive updates.'
              : 'Manage your resident account securely.'}
        </p>
      </header>

      <form onSubmit={submit} className="space-y-4">
        {mode !== 'reset-password' && mode !== 'sign-up' && (
          <label className="block space-y-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            Email address
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F2C59]/60" />
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={`${fieldClass} pl-10`} placeholder="Email address" />
            </span>
          </label>
        )}

        {mode === 'sign-up' && (
          <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Last name *
                <input required autoComplete="family-name" value={profile.lastName} onChange={(event) => updateProfile('lastName', event.target.value)} className={fieldClass} placeholder="Last name" />
              </label>
              <label className="block space-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                First name *
                <input required autoComplete="given-name" value={profile.firstName} onChange={(event) => updateProfile('firstName', event.target.value)} className={fieldClass} placeholder="First name" />
              </label>
              <label className="block space-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 sm:col-span-2">
                Middle name
                <input autoComplete="additional-name" value={profile.middleName} onChange={(event) => updateProfile('middleName', event.target.value)} className={fieldClass} placeholder="Middle name" />
              </label>
              <label className="block space-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Gender identity
                <select value={profile.genderIdentity} onChange={(event) => updateProfile('genderIdentity', event.target.value)} className={fieldClass}>
                  <option value="">Select (optional)</option>
                  {['MALE', 'FEMALE', 'GAY', 'LESBIAN', 'BISEXUAL', 'Prefer not to say'].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="block space-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Birthday
                <input type="date" autoComplete="bday" value={profile.birthday} onChange={(event) => updateProfile('birthday', event.target.value)} className={fieldClass} />
              </label>
              <label className="block space-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Email address *
                <span className="relative block">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F2C59]/60" />
                  <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={`${fieldClass} pl-10`} placeholder="Email address" />
                </span>
              </label>
              <label className="block space-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Contact number *
                <input required type="tel" autoComplete="tel" value={profile.contactNumber} onChange={(event) => updateProfile('contactNumber', event.target.value)} className={fieldClass} placeholder="09XXXXXXXXX or +639XXXXXXXXX" />
              </label>
              <label className="block space-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Street / sitio *
                <input required autoComplete="address-level3" value={profile.sitioAddress} onChange={(event) => updateProfile('sitioAddress', event.target.value)} className={fieldClass} placeholder="Street or sitio" />
              </label>
              <label className="block space-y-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 sm:col-span-2">
                Complete address *
                <input required autoComplete="street-address" value={profile.completeAddress} onChange={(event) => updateProfile('completeAddress', event.target.value)} className={fieldClass} placeholder="House number, street, compound" />
              </label>
          </div>
        )}

        {mode !== 'forgot-password' && (
          <label className="block space-y-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {mode === 'reset-password' ? 'New password' : 'Password'}
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F2C59]/60" />
              <input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'sign-up' || mode === 'reset-password' ? 'new-password' : 'current-password'} required value={password} onChange={(event) => setPassword(event.target.value)} className={`${fieldClass} pl-10 pr-11`} placeholder={mode === 'reset-password' ? 'New password' : mode === 'sign-up' ? 'Create password' : 'Password'} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0F2C59]">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
        )}

        {(mode === 'sign-up' || mode === 'reset-password') && (
          <label className="block space-y-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            {mode === 'sign-up' ? 'Confirm password' : 'Confirm new password'}
            <span className="relative block">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F2C59]/60" />
              <input type={showPasswordConfirmation ? 'text' : 'password'} autoComplete="new-password" required value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} className={`${fieldClass} pl-10 pr-11`} placeholder="Confirm password" />
              <button type="button" onClick={() => setShowPasswordConfirmation((visible) => !visible)} aria-label={showPasswordConfirmation ? 'Hide confirmation password' : 'Show confirmation password'} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0F2C59]">
                {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
        )}
        {mode === 'sign-up' && <p className="text-xs leading-relaxed text-slate-600">Use at least 8 characters with uppercase, lowercase, a number, and a symbol. For immediate access, email confirmation must be disabled in Supabase. Use an email address you control; older requests cannot be claimed until verification is enabled.</p>}

        {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
        {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</p>}

        <button type="submit" disabled={isLoading || (mode === 'reset-password' && !isRecoverySessionReady)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0F2C59] to-[#74445f] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-60">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === 'sign-up' ? 'Create account'
            : mode === 'forgot-password' ? 'Send reset link'
              : mode === 'reset-password' ? 'Update password'
                : 'Sign in'}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm">
        {mode === 'sign-in' && (
          <>
            <button type="button" onClick={() => { setMode('sign-up'); setError(''); setMessage(''); }} className="font-semibold text-[#0F2C59] hover:underline">Create an account</button>
            <button type="button" onClick={() => { setMode('forgot-password'); setError(''); setMessage(''); }} className="font-semibold text-[#0F2C59] hover:underline">Forgot password?</button>
          </>
        )}
        {mode !== 'sign-in' && (
          <button type="button" onClick={() => { setMode('sign-in'); setError(''); setMessage(''); }} className="font-semibold text-[#0F2C59] hover:underline">Back to sign in</button>
        )}
      </div>
      <a href="/" className="mt-4 block text-center text-xs font-medium text-slate-600 hover:text-[#0F2C59] hover:underline">Back to home</a>
    </section>
  );
}
