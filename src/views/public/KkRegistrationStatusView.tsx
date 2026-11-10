import { useState } from 'react';
import { ArrowLeft, SearchCheck } from 'lucide-react';
import { checkKkRegistrationStatus } from '../../services/supabaseData.ts';

const STATUS_COPY: Record<string, { title: string; description: string }> = {
  pending: {
    title: 'Pending review',
    description: 'Your registration was received and is waiting for review by the SK office.',
  },
  verified: {
    title: 'Verified',
    description: 'Your KK registration has been verified.',
  },
  needs_review: {
    title: 'Under review',
    description: 'The SK office needs to review your registration. Please contact the office for assistance.',
  },
  rejected: {
    title: 'Not approved',
    description: 'The SK office could not verify your registration. Contact the office for next steps.',
  },
  not_found: {
    title: 'Unable to confirm',
    description: 'The reference and identifier did not match a registration. Check them and try again, or contact the SK office.',
  },
};

interface KkRegistrationStatusViewProps {
  onBackToServices: () => void;
}

export function KkRegistrationStatusView({ onBackToServices }: KkRegistrationStatusViewProps) {
  const [refNumber, setRefNumber] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setStatus(null);
    setIsChecking(true);
    try {
      setStatus(await checkKkRegistrationStatus(refNumber.trim(), identifier.trim()));
    } catch (checkError) {
      setError(checkError instanceof Error
        ? checkError.message
        : 'Registration status could not be checked. Try again later.');
    } finally {
      setIsChecking(false);
    }
  };

  const statusCopy = status ? STATUS_COPY[status] ?? STATUS_COPY.not_found : null;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBackToServices}
        className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#0F2C59] hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2C59] dark:text-amber-300 dark:hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Youth Services / Bumalik sa Serbisyo
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F2C59]/10 text-[#0F2C59] dark:bg-amber-400/10 dark:text-amber-300">
          <SearchCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
          Check KK registration / Suriin ang rehistro ng KK
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Enter your registration reference and the email address or phone number used when registering. Only your status will be shown.
          {' '}
          / Ilagay ang iyong reference number at email o numero ng telepono na ginamit sa pagpaparehistro. Status lamang ang ipapakita.
        </p>

        <form onSubmit={checkStatus} className="mt-6 space-y-4">
          <div>
            <label htmlFor="kk-status-reference" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Registration reference / Reference number
            </label>
            <input
              id="kk-status-reference"
              autoComplete="off"
              required
              maxLength={64}
              value={refNumber}
              onChange={(event) => setRefNumber(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[#0F2C59] focus:ring-4 focus:ring-[#0F2C59]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="kk-status-identifier" className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Email or phone number / Email o numero ng telepono
            </label>
            <input
              id="kk-status-identifier"
              autoComplete="off"
              required
              maxLength={254}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none focus:border-[#0F2C59] focus:ring-4 focus:ring-[#0F2C59]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error}</p>}
          {statusCopy && (
            <div role="status" aria-live="polite" className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
              <p className="font-bold text-blue-950 dark:text-blue-100">{statusCopy.title}</p>
              <p className="mt-1 text-sm text-blue-900 dark:text-blue-200">{statusCopy.description}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isChecking}
            className="w-full rounded-xl bg-[#0F2C59] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#173B72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:cursor-wait disabled:opacity-60"
          >
            {isChecking ? 'Checking… / Sinusuri…' : 'Check status / Suriin ang status'}
          </button>
        </form>
      </div>
    </section>
  );
}
