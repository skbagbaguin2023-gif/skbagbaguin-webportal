import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../utils/auth.js';
import { supabaseConfigured } from '../services/supabase.ts';
import skLogo from '../assets/images/skLogo.png';
import backgroundImage from '../assets/images/3sbg.jpg';
import { ResidentAuthPanel } from '../components/ResidentAuthPanel.tsx';
import { getUserFacingError } from '../utils/userFacingError.ts';

export default function AdminLogin() {
  const isPasswordRecovery = window.location.pathname === '/reset-password'
    || new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery';
  const [audience, setAudience] = useState(() =>
    isPasswordRecovery || new URLSearchParams(window.location.search).get('mode') === 'resident'
      ? 'resident'
      : 'admin'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const authenticated = await login(email, password);
      if (authenticated) {
        window.location.assign('/admin');
      } else {
        setError('This account is not authorized as an administrator.');
      }
    } catch (error) {
      setError(getUserFacingError(error, 'Unable to sign in right now. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-8"
      style={{
        backgroundImage: `linear-gradient(112deg, rgba(10, 36, 82, 0.94) 0%, rgba(30, 66, 131, 0.82) 43%, rgba(225, 232, 244, 0.78) 100%), url(${backgroundImage})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-3 rounded-[2rem] border border-white/25 sm:inset-5" />
      <img aria-hidden="true" src={skLogo} alt="" className="pointer-events-none absolute right-[7%] top-[7%] hidden w-48 opacity-[0.12] mix-blend-multiply md:block lg:w-72" />
      <div className="relative z-10 w-full max-w-3xl">
        {!isPasswordRecovery && <div role="tablist" aria-label="Choose account type" className="mx-auto mb-4 grid max-w-xl grid-cols-2 rounded-xl border border-white/35 bg-white/20 p-1 shadow-sm backdrop-blur-md">
          <button
            type="button"
            role="tab"
            aria-selected={audience === 'admin'}
            onClick={() => {
              setAudience('admin');
              window.history.replaceState({}, '', window.location.pathname);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${audience === 'admin' ? 'bg-white/90 text-[#0F2C59] shadow-sm' : 'text-white hover:bg-white/15'}`}
          >
            Administrator
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={audience === 'resident'}
            onClick={() => {
              setAudience('resident');
              window.history.replaceState({}, '', `${window.location.pathname}?mode=resident`);
            }}
            className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${audience === 'resident' ? 'bg-white/90 text-[#0F2C59] shadow-sm' : 'text-white hover:bg-white/15'}`}
          >
            Resident account
          </button>
        </div>}

        {audience === 'resident' ? (
          <ResidentAuthPanel onAuthenticated={() => window.location.assign('/?page=account')} />
        ) : (
        <div className="mx-auto w-full max-w-md rounded-3xl border border-white/60 bg-white/75 p-7 shadow-2xl shadow-[#071324]/20 backdrop-blur-2xl sm:p-9">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 p-1 shadow-sm">
            <img
              src={skLogo}
              alt="SK Bagbaguin Youth Assembly"
              className="h-full w-full rounded-full object-contain pointer-events-none"
            />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose-700">SK Bagbaguin Portal</p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-950">Administrator login</h1>
          <p className="text-sm text-slate-600 mt-1">Sign in to access the admin dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-white/60 bg-white/80 px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-[#0F2C59]/30"
            />
          </div>

          {!supabaseConfigured && (
            <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Supabase is not configured. Add your project URL and publishable key to .env.local.
            </p>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-xl border border-white/60 bg-white/80 px-3.5 py-3 pr-11 text-sm text-slate-900 shadow-sm outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-[#0F2C59]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0F2C59]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-[#0F2C59] to-[#74445f] py-3 text-sm font-semibold text-white shadow-md transition hover:brightness-110 disabled:opacity-60"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <a href="/" className="mt-5 block text-center text-xs font-medium text-slate-600 hover:text-[#0F2C59] hover:underline">Back to home</a>
        </div>
        )}
      </div>
    </main>
  );
}
