import { useState } from 'react';
import { CheckCircle2, ClipboardList, X } from 'lucide-react';
import type { KkProfilingData } from '../../types/index.ts';
import { submitKkProfile, syncKkProfileToGoogle } from '../../services/supabaseData.ts';
import { KK_PRIVACY_NOTICE_VERSION, normalizeKkPhone, validateKkProfile } from '../../utils/kkLogic.ts';
import { useModalScrollLock } from '../useModalScrollLock.ts';

interface KkProfilingFormProps {
  onClose: () => void;
}

const SITIO_OPTIONS = [
  'DELA CRUZ ST.', 'SEBASTIAN ST.', 'GREGORIO COMPOUND', 'GARCIA COMPOUND',
  'BENITEZ COMPOUND', 'BAGONG NAYON', 'ST. JOSEPH STREET', 'N.Y.',
  'VICTORIA ST.', 'DEMITION COMPOUND', 'ATIS ST.', 'AVOCADO ST.',
  'BAYABAS ST.', 'CKV', 'SANTOL ST.', 'DUHAT ST.', 'SAPA', 'A. MARIANO',
  'SITIO MALINIS', 'WESSON', 'SAMAKA', 'DEKADA', 'BERNARDINO', 'MAURICIO',
  'Iba pa:',
];
const CLASSIFICATIONS = [
  'In School Youth',
  'Out of School Youth',
  'Working Youth',
  'Youth w/ Special Needs (PWD)',
  'Single/Solo Parent Youth',
];
const EDUCATIONAL_BACKGROUNDS = [
  'Elementary Level', 'Elementary Graduate', 'Highschool Level', 'Highschool Graduate',
  'Senior Highschool Level', 'Senior Highschool Graduate', 'College Level',
  'College Graduate', 'Vocational Graduate', 'ALS Level', 'ALS Graduate',
];
const CIVIL_STATUSES = [
  'SINGLE', 'MARRIED', 'WIDOWED', 'DIVORCED', 'SEPARATED', 'ANNUALLED', 'LIVE IN',
];
const WORK_STATUSES = [
  'Employed', 'Unemployed', 'Self-Employed',
  'Currently looking for a job / 1st time job seeker', 'Not Interested',
];
const EMPTY_PROFILE: KkProfilingData = {
  email: '',
  firstName: '',
  middleName: '',
  lastName: '',
  genderIdentity: '',
  age: 0,
  birthday: '',
  birthplace: '',
  contactNumber: '',
  civilStatus: '',
  sitioAddress: '',
  sitioOther: '',
  completeAddress: '',
  voterStatus: '',
  votedLastSkElection: '',
  skElectionVoteCount: '',
  skElectionVoteCountOther: '',
  nationalVoter: '',
  precinctNumber: '',
  youthClassifications: [],
  workStatus: '',
  educationalBackground: '',
};

const fieldClass = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-xs transition placeholder:text-slate-400 focus:border-[#0F2C59] focus:outline-none focus:ring-4 focus:ring-[#0F2C59]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-amber-400 dark:focus:ring-amber-400/10';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
      <span>{label} *</span>
      {children}
    </label>
  );
}

function RadioGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs dark:border-slate-700 dark:bg-slate-800/50">
      <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">{label} *</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
              value === option
                ? 'border-[#0F2C59] bg-[#0F2C59]/10 font-semibold text-[#0F2C59] dark:border-amber-400 dark:bg-amber-400/10 dark:text-amber-300'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500'
            }`}
          >
            <input
              type="radio"
              name={label}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              required
              className="h-4 w-4 accent-[#0F2C59]"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function KkProfilingForm({
  onClose,
}: KkProfilingFormProps) {
  useModalScrollLock(true);
  const [profile, setProfile] = useState<KkProfilingData>(EMPTY_PROFILE);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [syncError, setSyncError] = useState('');

  const update = <K extends keyof KkProfilingData>(key: K, value: KkProfilingData[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSyncError('');
    const validationErrors = validateKkProfile(profile, privacyConsent);
    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors)[0]);
      return;
    }

    setIsSaving(true);
    const normalizedProfile = {
      ...profile,
      email: profile.email.trim(),
      firstName: profile.firstName.trim(),
      middleName: profile.middleName.trim(),
      lastName: profile.lastName.trim(),
      contactNumber: normalizeKkPhone(profile.contactNumber),
      sitioOther: profile.sitioOther.trim(),
      completeAddress: profile.completeAddress.trim(),
      precinctNumber: profile.precinctNumber.trim(),
    };

    try {
      const saved = await submitKkProfile({
        ...normalizedProfile,
        privacyConsent: true,
        privacyNoticeVersion: KK_PRIVACY_NOTICE_VERSION,
      });
      setReference(saved.refNumber);
      try {
        await syncKkProfileToGoogle(saved.applicationId);
      } catch (syncFailure) {
        setSyncError(syncFailure instanceof Error
          ? syncFailure.message
          : 'The profile is saved in the portal, but Google sync could not be confirmed.');
      }
    } catch (saveFailure) {
      setError(saveFailure instanceof Error
        ? saveFailure.message
        : 'The profile could not be saved. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-900/70 p-4 backdrop-blur-xs" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="my-8 flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <header className="flex shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-[#081830] via-[#0F2C59] to-[#173B72] px-5 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-300/30 bg-white/10 text-amber-300">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Barangay Bagbaguin Youth Assistance Portal</p>
            <h2 className="truncate text-lg font-bold">Katipunan ng Kabataan Profiling</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="shrink-0 rounded-xl border border-white/10 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </header>

        {reference ? (
          <div className="space-y-4 overflow-y-auto p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">KK profile saved</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Your portal reference is <strong>{reference}</strong>.</p>
            {syncError && (
              <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-left text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                Your profile is saved in the portal, but it could not be synchronized to the Google Form. The SK administrator should check the Google sync setup before relying on the linked sheet. {syncError}
              </p>
            )}
            {!syncError && <p className="text-sm text-emerald-700 dark:text-emerald-400">Your response was also sent to the existing Google Form.</p>}
            <button type="button" onClick={onClose} className="rounded-lg bg-[#0F2C59] px-5 py-2 text-sm font-semibold text-white">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="kk-profile-form min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-slate-900">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F2C59] text-amber-300 shadow-sm">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#0F2C59] dark:text-white">Get started with your youth profile</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Share your information to help the SK understand and serve the youth of Bagbaguin. Fields marked with * are required.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs dark:border-slate-700 dark:bg-slate-800/40 sm:p-5">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Personal details / Impormasyon ng sarili</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tell us how to identify and contact you. / Ibigay ang impormasyon para makilala at makontak ka.</p>
              </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Complete the required fields. This submission is saved securely in the portal. / Kumpletuhin ang mga kinakailangang field. Ligtas na ise-save ang impormasyong ito sa portal.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Email Account / Email ng account"><input type="email" autoComplete="email" required value={profile.email} onChange={(event) => update('email', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="First Name / Pangalan"><input required value={profile.firstName} onChange={(event) => update('firstName', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Middle Name / Gitnang pangalan"><input required value={profile.middleName} onChange={(event) => update('middleName', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Last Name / Apelyido"><input required value={profile.lastName} onChange={(event) => update('lastName', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Age (15–30) / Edad"><input type="number" min="15" max="30" required value={profile.age || ''} onChange={(event) => update('age', Number(event.target.value))} className={fieldClass} /></FormField>
              <FormField label="Birthday / Kaarawan"><input type="date" required value={profile.birthday} onChange={(event) => update('birthday', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Birthplace / Lugar ng kapanganakan"><input required value={profile.birthplace} onChange={(event) => update('birthplace', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Contact Number / Numero ng telepono"><input type="tel" autoComplete="tel" required value={profile.contactNumber} onChange={(event) => update('contactNumber', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Street / Sitio Address">
                <select required value={profile.sitioAddress} onChange={(event) => update('sitioAddress', event.target.value)} className={fieldClass}>
                  <option value="">Select street or sitio</option>
                  {SITIO_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </FormField>
              {profile.sitioAddress === 'Iba pa:' && (
                <FormField label="Other Street / Sitio / Iba pang kalye o sitio"><input required value={profile.sitioOther} onChange={(event) => update('sitioOther', event.target.value)} className={fieldClass} /></FormField>
              )}
              <FormField label="Complete Address / Kumpletong tirahan"><input required value={profile.completeAddress} onChange={(event) => update('completeAddress', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Precinct Number (if applicable) / Numero ng presinto (kung mayroon)"><input value={profile.precinctNumber} onChange={(event) => update('precinctNumber', event.target.value)} className={fieldClass} /></FormField>
            </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-xs dark:border-slate-700 dark:bg-slate-800/40 sm:p-5">
            <div className="mb-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">About you and your community / Tungkol sa iyo at sa iyong komunidad</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Select the options that best describe your background. / Piliin ang mga naaangkop na sagot.</p>
            </div>
            <RadioGroup label="Sex / Gender Identity" value={profile.genderIdentity} options={['MALE', 'FEMALE', 'GAY', 'LESBIAN', 'BISEXUAL', 'Prefer not to say']} onChange={(value) => update('genderIdentity', value)} />
            <RadioGroup label="Civil Status" value={profile.civilStatus} options={CIVIL_STATUSES} onChange={(value) => update('civilStatus', value)} />
            <RadioGroup label="Registered Voter in Barangay Bagbaguin or Resident Only?" value={profile.voterStatus} options={['Voter', 'Resident Only', 'Voter & Resident']} onChange={(value) => update('voterStatus', value)} />
            <RadioGroup label="Did you vote in the last SK Election?" value={profile.votedLastSkElection} options={['Yes', 'No']} onChange={(value) => update('votedLastSkElection', value)} />
            <RadioGroup label="How many times did you vote for SK Elections?" value={profile.skElectionVoteCount} options={['1', '2', '3', '4', '5', 'Iba pa:']} onChange={(value) => update('skElectionVoteCount', value)} />
            {profile.skElectionVoteCount === 'Iba pa:' && (
              <FormField label="Other Number of Times"><input required value={profile.skElectionVoteCountOther} onChange={(event) => update('skElectionVoteCountOther', event.target.value)} className={fieldClass} /></FormField>
            )}
            <RadioGroup label="Are you a registered national voter?" value={profile.nationalVoter} options={['YES', 'NO']} onChange={(value) => update('nationalVoter', value)} />

            <fieldset className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs dark:border-slate-700 dark:bg-slate-800/50">
              <legend className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">Youth Classification * (select all that apply)</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {CLASSIFICATIONS.map((classification) => (
                  <label
                    key={classification}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                      profile.youthClassifications.includes(classification)
                        ? 'border-[#0F2C59] bg-[#0F2C59]/10 font-semibold text-[#0F2C59] dark:border-amber-400 dark:bg-amber-400/10 dark:text-amber-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={profile.youthClassifications.includes(classification)}
                      onChange={(event) => update(
                        'youthClassifications',
                        event.target.checked
                          ? [...profile.youthClassifications, classification]
                          : profile.youthClassifications.filter((item) => item !== classification)
                      )}
                      className="h-4 w-4 accent-[#0F2C59]"
                    />
                    {classification}
                  </label>
                ))}
              </div>
            </fieldset>

            <RadioGroup label="Work Status" value={profile.workStatus} options={WORK_STATUSES} onChange={(value) => update('workStatus', value)} />
            <RadioGroup label="Educational Background" value={profile.educationalBackground} options={EDUCATIONAL_BACKGROUNDS} onChange={(value) => update('educationalBackground', value)} />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              <input
                type="checkbox"
                required
                checked={privacyConsent}
                onChange={(event) => setPrivacyConsent(event.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[#0F2C59]"
              />
              <span>
                I consent to the collection and use of my information for KK profiling and SK service eligibility. Only authorized SK officials can review my profile. / Pumapayag ako sa pagkolekta at paggamit ng aking impormasyon para sa KK profiling at pagiging kwalipikado sa mga serbisyo ng SK. Mga awtorisadong opisyal lamang ng SK ang maaaring tumingin nito.
              </span>
            </label>

            {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
            <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-700">
              <button type="submit" disabled={isSaving} className="flex items-center gap-2 rounded-xl bg-[#0F2C59] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#173B72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-60">
                {isSaving ? 'Saving...' : 'Submit KK Profile / Isumite ang profile ng KK'}
                {!isSaving && <CheckCircle2 className="h-4 w-4 text-amber-300" />}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
