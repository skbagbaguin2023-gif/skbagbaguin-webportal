import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, FileSearch, Loader2, Search } from 'lucide-react';
import type { ApplicationTrackingResult } from '../../services/supabaseData.ts';
import { findApplicationForTracking } from '../../services/supabaseData.ts';
import Reveal from '../../components/Reveal.jsx';

interface TrackRequestViewProps {
  onNavigateToServices: () => void;
}

const statusSteps = ['Pending', 'Under Review', 'Approved'];

function getStatusMessage(result: ApplicationTrackingResult): string {
  if (result.status === 'Rejected') return 'The request was not approved. Please contact the SK Council Secretariat for assistance.';
  if (result.status === 'Approved') return 'Your request has been approved. Please wait for pickup or release instructions from the SK Council Secretariat.';
  if (result.status === 'Under Review') return 'The SK Council is reviewing your request and will contact you if clarification is needed.';
  return 'Your request has been received and is waiting for initial verification.';
}

export const TrackRequestView: React.FC<TrackRequestViewProps> = ({ onNavigateToServices }) => {
  const [refNumber, setRefNumber] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [result, setResult] = useState<ApplicationTrackingResult | null>(null);
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setIsSearching(true);

    try {
      const trackingResult = await findApplicationForTracking(refNumber, contactNumber);
      if (!trackingResult) {
        setError('No matching request was found. Check your reference code and mobile number.');
      } else {
        setResult(trackingResult);
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The request could not be checked. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const currentStep = result ? statusSteps.indexOf(result.status) : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Reveal className="bg-[#0F2C59] text-white rounded-2xl p-6 sm:p-10 border border-navy-800 shadow-md">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-white/10 px-3 py-1 rounded-full">
            <FileSearch className="w-3.5 h-3.5" />
            <span>Request Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">Track Your Service Request</h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Enter the reference code and mobile number used in your request. Your information is used only to find your request.
          </p>
        </div>
      </Reveal>

      <Reveal className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="tracking-reference" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Reference Code
            </label>
            <input
              id="tracking-reference"
              value={refNumber}
              onChange={(event) => setRefNumber(event.target.value)}
              placeholder="SKB-PRT-2026-0007"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-mono uppercase text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <div>
            <label htmlFor="tracking-contact" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Mobile Number
            </label>
            <input
              id="tracking-contact"
              value={contactNumber}
              onChange={(event) => setContactNumber(event.target.value)}
              placeholder="09XXXXXXXXX"
              inputMode="tel"
              required
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={isSearching}
            className="w-full sm:w-auto bg-[#F5A623] hover:bg-[#D98E16] disabled:opacity-60 text-[#081830] font-bold text-sm px-5 py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isSearching ? 'Checking...' : 'Track Request'}
          </button>
        </form>
      </Reveal>

      {result && (
        <Reveal className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reference Code</p>
              <p className="font-mono font-bold text-lg text-[#0F2C59] dark:text-amber-400">{result.refNumber}</p>
            </div>
            <span className="rounded-full bg-amber-100 dark:bg-amber-950/50 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300">{result.status}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div><span className="block text-slate-500 dark:text-slate-400">Service</span><strong>{result.serviceType}</strong></div>
            <div><span className="block text-slate-500 dark:text-slate-400">Applicant</span><strong>{result.applicantName}</strong></div>
            {result.dateNeeded && <div><span className="block text-slate-500 dark:text-slate-400">Date Needed</span><strong>{result.dateNeeded}</strong></div>}
            {result.copiesNeeded !== undefined && <div><span className="block text-slate-500 dark:text-slate-400">Copies</span><strong>{result.copiesNeeded}</strong></div>}
          </div>

          {result.status !== 'Rejected' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => (
                  <React.Fragment key={step}>
                    <div className={`flex flex-col items-center gap-1 text-center ${index <= currentStep ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {index <= currentStep ? <CheckCircle2 className="w-5 h-5" /> : <Clock3 className="w-5 h-5" />}
                      <span className="text-[10px] font-semibold">{step}</span>
                    </div>
                    {index < statusSteps.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${index < currentStep ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          <p className="rounded-lg bg-slate-50 dark:bg-slate-800/70 p-3 text-xs text-slate-600 dark:text-slate-300">{getStatusMessage(result)}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Last updated: {new Date(result.lastUpdated).toLocaleString()}</p>
        </Reveal>
      )}

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Do not have a reference code?{' '}
        <button onClick={onNavigateToServices} className="font-semibold text-[#0F2C59] dark:text-amber-400 hover:underline cursor-pointer">Request a service</button>
      </p>
    </div>
  );
};
