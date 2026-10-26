import { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { KkProfilingData, YouthApplication, YouthService } from '../../types/index.ts';
import { generateApplicationRef } from '../../utils/portalLogic.ts';
import { generateUuid } from '../../utils/uuid.ts';
import { syncKkProfileToGoogle } from '../../services/supabaseData.ts';

interface KkProfilingFormProps {
  onClose: () => void;
  services: YouthService[];
  onSubmitApplication: (application: YouthApplication) => Promise<void>;
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

const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:ring-amber-400';

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
    <fieldset className="space-y-2">
      <legend className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">{label} *</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="radio"
              name={label}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              required
              className="accent-[#0F2C59]"
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
  services,
  onSubmitApplication,
}: KkProfilingFormProps) {
  const [profile, setProfile] = useState<KkProfilingData>(EMPTY_PROFILE);
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
    if (!profile.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!Number.isInteger(profile.age) || profile.age < 15 || profile.age > 30) {
      setError('KK profiling is for youth ages 15 to 30.');
      return;
    }
    if (!/^(09\d{9}|\+639\d{9})$/.test(profile.contactNumber.replace(/[\s-]/g, ''))) {
      setError('Enter a valid 11-digit Philippine contact number.');
      return;
    }
    if (profile.youthClassifications.length === 0) {
      setError('Choose at least one youth classification.');
      return;
    }
    if (profile.sitioAddress === 'Iba pa:' && !profile.sitioOther.trim()) {
      setError('Enter your street or sitio.');
      return;
    }

    setIsSaving(true);
    const serviceName = services.find((service) => /profiling/i.test(service.name))?.name
      ?? 'Katipunan ng Kabataan (KK) Official Profiling';
    const fullName = [profile.firstName, profile.middleName, profile.lastName]
      .map((part) => part.trim())
      .filter(Boolean)
      .join(' ');
    const normalizedProfile = {
      ...profile,
      email: profile.email.trim(),
      firstName: profile.firstName.trim(),
      middleName: profile.middleName.trim(),
      lastName: profile.lastName.trim(),
      contactNumber: profile.contactNumber.replace(/[\s-]/g, ''),
      sitioOther: profile.sitioOther.trim(),
      completeAddress: profile.completeAddress.trim(),
      precinctNumber: profile.precinctNumber.trim(),
    };
    const id = `app-${generateUuid()}`;
    const application: YouthApplication = {
      id,
      refNumber: generateApplicationRef(serviceName, Math.floor(100 + Math.random() * 900)),
      applicantName: fullName,
      age: profile.age,
      birthday: profile.birthday,
      gender: profile.genderIdentity,
      sitio: profile.sitioAddress === 'Iba pa:' ? profile.sitioOther.trim() : profile.sitioAddress,
      address: normalizedProfile.completeAddress,
      contactNumber: normalizedProfile.contactNumber,
      email: normalizedProfile.email,
      serviceType: serviceName,
      details: 'Katipunan ng Kabataan profiling form submission.',
      kkProfile: normalizedProfile,
      googleSyncStatus: 'Pending',
      status: 'Pending',
      submittedAt: new Date().toISOString(),
      adminNotes: 'KK profile submitted through the youth portal.',
      documentsAttached: [],
    };

    try {
      await onSubmitApplication(application);
      setReference(application.refNumber);
      try {
        await syncKkProfileToGoogle(id);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-xs">
      <section className="my-8 max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-center justify-between bg-[#0F2C59] px-6 py-4 text-white">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Barangay Bagbaguin Youth Assistance Portal</p>
            <h2 className="text-lg font-bold">Katipunan ng Kabataan Profiling</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white">
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
          <form onSubmit={submit} className="max-h-[calc(90vh-76px)] space-y-5 overflow-y-auto p-6">
            <p className="text-xs text-slate-500 dark:text-slate-400">Complete the required fields. This submission is saved in the portal and synchronized to the existing Google Form response sheet.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Email Account"><input type="email" autoComplete="email" required value={profile.email} onChange={(event) => update('email', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="First Name"><input required value={profile.firstName} onChange={(event) => update('firstName', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Middle Name"><input required value={profile.middleName} onChange={(event) => update('middleName', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Last Name"><input required value={profile.lastName} onChange={(event) => update('lastName', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Age (15–30)"><input type="number" min="15" max="30" required value={profile.age || ''} onChange={(event) => update('age', Number(event.target.value))} className={fieldClass} /></FormField>
              <FormField label="Birthday"><input type="date" required value={profile.birthday} onChange={(event) => update('birthday', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Birthplace"><input required value={profile.birthplace} onChange={(event) => update('birthplace', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Contact Number"><input type="tel" autoComplete="tel" required value={profile.contactNumber} onChange={(event) => update('contactNumber', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Street / Sitio Address">
                <select required value={profile.sitioAddress} onChange={(event) => update('sitioAddress', event.target.value)} className={fieldClass}>
                  <option value="">Select street or sitio</option>
                  {SITIO_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </FormField>
              {profile.sitioAddress === 'Iba pa:' && (
                <FormField label="Other Street / Sitio"><input required value={profile.sitioOther} onChange={(event) => update('sitioOther', event.target.value)} className={fieldClass} /></FormField>
              )}
              <FormField label="Complete Address"><input required value={profile.completeAddress} onChange={(event) => update('completeAddress', event.target.value)} className={fieldClass} /></FormField>
              <FormField label="Precinct Number (if applicable)"><input value={profile.precinctNumber} onChange={(event) => update('precinctNumber', event.target.value)} className={fieldClass} /></FormField>
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

            <fieldset className="space-y-2">
              <legend className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300">Youth Classification * (select all that apply)</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {CLASSIFICATIONS.map((classification) => (
                  <label key={classification} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={profile.youthClassifications.includes(classification)}
                      onChange={(event) => update(
                        'youthClassifications',
                        event.target.checked
                          ? [...profile.youthClassifications, classification]
                          : profile.youthClassifications.filter((item) => item !== classification)
                      )}
                      className="accent-[#0F2C59]"
                    />
                    {classification}
                  </label>
                ))}
              </div>
            </fieldset>

            <RadioGroup label="Work Status" value={profile.workStatus} options={WORK_STATUSES} onChange={(value) => update('workStatus', value)} />
            <RadioGroup label="Educational Background" value={profile.educationalBackground} options={EDUCATIONAL_BACKGROUNDS} onChange={(value) => update('educationalBackground', value)} />

            {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={isSaving} className="rounded-lg bg-[#0F2C59] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {isSaving ? 'Saving and syncing...' : 'Submit KK Profile'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
