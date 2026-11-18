import React, { useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { AlertCircle, Bell, CheckCircle2, Clock3, FileSearch, Home, LayoutDashboard, Loader2, LogOut, Pencil, RefreshCw, ShieldCheck, Trash2, UserRound, XCircle } from 'lucide-react';
import type { ApplicationEditHistory, ResidentApplication } from '../../services/supabaseData.ts';
import {
  cancelResidentApplication,
  deleteApplicationDocument,
  getApplicationEditHistory,
  getResidentApplicationClaims,
  getResidentApplications,
  submitResidentApplicationClaim,
  subscribeToResidentApplications,
  updateResidentApplication,
  uploadApplicationDocument,
  uploadPrintingRequestPdf,
} from '../../services/supabaseData.ts';
import type { ApplicationStatus, KkProfilingData, ResidentProfile, YouthApplication } from '../../types/index.ts';
import { getResidentProfile } from '../../services/residentProfile.ts';
import { saveResidentProfile } from '../../services/residentProfileService.ts';
import { isAdminUser } from '../../services/supabase.ts';
import { ResidentAuthPanel } from '../../components/ResidentAuthPanel.tsx';
import { TrackRequestView } from './TrackRequestView.tsx';
import { getUserFacingError } from '../../utils/userFacingError.ts';
import Reveal from '../../components/Reveal.jsx';

export type DashboardTab = 'overview' | 'applications' | 'track' | 'profile' | 'notifications';

const dashboardTabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'applications', label: 'My applications', icon: <Pencil className="h-4 w-4" /> },
  { id: 'track', label: 'Track request', icon: <FileSearch className="h-4 w-4" /> },
  { id: 'profile', label: 'Personal details', icon: <UserRound className="h-4 w-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
];

const fieldClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:text-white';
const documentTypes = ['application/pdf', 'image/jpeg', 'image/png'];
const profileFields: { key: keyof KkProfilingData; label: string; type?: 'date' | 'number' | 'textarea' | 'email' }[] = [
  { key: 'firstName', label: 'First name' },
  { key: 'middleName', label: 'Middle name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'genderIdentity', label: 'Gender identity' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'birthday', label: 'Birthday', type: 'date' },
  { key: 'birthplace', label: 'Birthplace' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'contactNumber', label: 'Contact number' },
  { key: 'civilStatus', label: 'Civil status' },
  { key: 'sitioAddress', label: 'Street / sitio' },
  { key: 'sitioOther', label: 'Other street / sitio' },
  { key: 'completeAddress', label: 'Complete address' },
  { key: 'voterStatus', label: 'Voter status' },
  { key: 'votedLastSkElection', label: 'Voted in the last SK election' },
  { key: 'skElectionVoteCount', label: 'SK election vote count' },
  { key: 'skElectionVoteCountOther', label: 'Other SK election vote count' },
  { key: 'nationalVoter', label: 'Registered national voter' },
  { key: 'precinctNumber', label: 'Precinct number' },
  { key: 'youthClassifications', label: 'Youth classifications', type: 'textarea' },
  { key: 'workStatus', label: 'Work status' },
  { key: 'educationalBackground', label: 'Educational background' },
];

const topLevelFields: { key: keyof YouthApplication; label: string; type?: string }[] = [
  { key: 'applicantName', label: 'Applicant name' },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'birthday', label: 'Birthday', type: 'date' },
  { key: 'gender', label: 'Gender' },
  { key: 'sitio', label: 'Sitio' },
  { key: 'address', label: 'Address' },
  { key: 'contactNumber', label: 'Contact number' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'notificationPreference', label: 'Preferred notification' },
  { key: 'messengerName', label: 'Messenger name' },
  { key: 'messengerProfileUrl', label: 'Facebook profile URL' },
  { key: 'schoolOrOrg', label: 'School or organization' },
  { key: 'yearLevel', label: 'Year level' },
  { key: 'requestedDate', label: 'Requested date', type: 'date' },
  { key: 'dateNeeded', label: 'Date needed', type: 'date' },
  { key: 'copiesNeeded', label: 'Copies needed', type: 'number' },
  { key: 'details', label: 'Request details', type: 'textarea' },
];

function getApplicationEmail(application: ResidentApplication): string {
  return application.email || application.kkProfile?.email || '';
}

function getApplicationStatusMessage(status: ApplicationStatus): string {
  switch (status) {
    case 'Pending':
      return 'Your application is waiting for review.';
    case 'Under Review':
      return 'The SK office is reviewing your application.';
    case 'Approved':
      return 'Your application has been approved.';
    case 'Rejected':
      return 'Your application was not approved.';
    case 'Cancelled':
      return 'This application was cancelled.';
  }
}

function getApplicationStatusClasses(status: ApplicationStatus): string {
  switch (status) {
    case 'Approved':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    case 'Rejected':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300';
    case 'Pending':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    case 'Under Review':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
    case 'Cancelled':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

function formatApplicationUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Update time unavailable'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function ApplicationEditor({
  application,
  onCancel,
  onSaved,
}: {
  application: ResidentApplication;
  onCancel: () => void;
  onSaved: (warning?: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<YouthApplication>(application);
  const [reason, setReason] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const isPrinting = /printing/i.test(application.serviceType);
  const documents = draft.documentsAttached ?? [];
  const remainingDocuments = documents.filter((document) => !document.storagePath || !removedPaths.includes(document.storagePath));

  const updateTopLevel = (key: keyof YouthApplication, value: string | number) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateProfile = (key: keyof KkProfilingData, value: string | number | string[]) => {
    setDraft((current) => {
      if (!current.kkProfile) return current;
      const kkProfile = { ...current.kkProfile, [key]: value };
      return {
        ...current,
        kkProfile,
        applicantName: [kkProfile.firstName, kkProfile.middleName, kkProfile.lastName]
          .map((part) => part.trim())
          .filter(Boolean)
          .join(' '),
        age: kkProfile.age,
        birthday: kkProfile.birthday,
        gender: kkProfile.genderIdentity,
        sitio: kkProfile.sitioAddress === 'Iba pa:' ? kkProfile.sitioOther : kkProfile.sitioAddress,
        address: kkProfile.completeAddress,
        contactNumber: kkProfile.contactNumber,
        email: kkProfile.email,
      };
    });
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files);
    if (accepted.some((file) => !documentTypes.includes(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024)) {
      setError('Choose non-empty PDF, JPG, or PNG files that are 10 MB or smaller.');
      return;
    }
    if (isPrinting && accepted.some((file) => file.type !== 'application/pdf')) {
      setError('Printing requests can include a PDF file only.');
      return;
    }
    if (isPrinting && remainingDocuments.length + accepted.length > 1) {
      setError('A printing request can have one PDF. Remove the current file before adding a replacement.');
      return;
    }
    if (!isPrinting && remainingDocuments.length + newFiles.length + accepted.length > 10) {
      setError('You can attach up to 10 documents.');
      return;
    }
    setNewFiles((current) => [...current, ...accepted]);
    setError('');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    const uploadedPaths: string[] = [];
    try {
      const nextDocuments = [...remainingDocuments];
      for (const file of newFiles) {
        const storagePath = isPrinting
          ? await uploadPrintingRequestPdf(file)
          : await uploadApplicationDocument(file);
        uploadedPaths.push(storagePath);
        nextDocuments.push({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          status: 'Pending Review',
          storagePath,
        });
      }
      await updateResidentApplication({
        ...draft,
        documentsAttached: nextDocuments,
      }, reason, removedPaths);
      let removalError = '';
      for (const path of removedPaths) {
        try {
          await deleteApplicationDocument(path);
        } catch (requestError) {
          removalError = `Your changes were saved, but an old document could not be removed: ${
            getUserFacingError(requestError, 'Please try again later.')
          }`;
        }
      }
      await onSaved(removalError);
    } catch (requestError) {
      for (const path of uploadedPaths) {
        try {
          await deleteApplicationDocument(path);
        } catch (cleanupError) {
          console.error('Unable to remove a newly uploaded document after a failed application edit.', cleanupError);
        }
      }
      setError(getUserFacingError(requestError, 'The application could not be updated.'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (
    key: keyof YouthApplication,
    label: string,
    type = 'text',
  ) => {
    const value = draft[key];
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    return (
      <label key={key} className="block space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
        {label}
        {type === 'textarea' ? (
          <textarea value={String(value)} onChange={(event) => updateTopLevel(key, event.target.value)} rows={3} className={fieldClass} />
        ) : (
          <input type={type} value={value} onChange={(event) => updateTopLevel(key, type === 'number' ? Number(event.target.value) : event.target.value)} className={fieldClass} />
        )}
      </label>
    );
  };

  const renderProfileField = (field: typeof profileFields[number]) => {
    const value = draft.kkProfile?.[field.key];
    if (value === undefined) return null;
    const type = field.type ?? 'text';
    const stringValue = Array.isArray(value) ? value.join(', ') : String(value);
    return (
      <label key={field.key} className="block space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
        {field.label}
        {type === 'textarea' ? (
          <textarea
            value={stringValue}
            onChange={(event) => updateProfile(field.key, event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
            rows={2}
            className={fieldClass}
          />
        ) : (
          <input
            type={type}
            value={stringValue}
            onChange={(event) => updateProfile(field.key, type === 'number' ? Number(event.target.value) : event.target.value)}
            className={fieldClass}
          />
        )}
      </label>
    );
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        Changes are available only while the request is Pending. KK changes update your portal profile; the original Google Form response is not changed.
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {topLevelFields
          .filter((field) => !draft.kkProfile || !['applicantName', 'age', 'birthday', 'gender', 'sitio', 'address', 'contactNumber', 'email'].includes(field.key))
          .map((field) => renderField(field.key, field.label, field.type))}
      </div>

      {draft.kkProfile && (
        <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <legend className="px-2 text-sm font-bold text-slate-900 dark:text-white">KK profiling details</legend>
          <div className="grid gap-3 sm:grid-cols-2">{profileFields.map(renderProfileField)}</div>
        </fieldset>
      )}

      <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
        <legend className="px-2 text-sm font-bold text-slate-900 dark:text-white">Documents</legend>
        <ul className="space-y-2">
          {documents.map((document, index) => {
            const path = document.storagePath ?? '';
            const isRemoved = Boolean(path && removedPaths.includes(path));
            return (
              <li key={`${document.name}-${path || index}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2 text-xs dark:bg-slate-800">
                <span className={`min-w-0 truncate ${isRemoved ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}`}>{document.name}</span>
                {path && (
                  <button
                    type="button"
                    onClick={() => setRemovedPaths((current) => isRemoved ? current.filter((item) => item !== path) : [...current, path])}
                    className="shrink-0 rounded px-2 py-1 font-semibold text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-950/50"
                  >
                    {isRemoved ? 'Keep' : 'Remove'}
                  </button>
                )}
              </li>
            );
          })}
          {newFiles.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-2 text-xs dark:bg-emerald-950/30">
              <span className="min-w-0 truncate text-emerald-800 dark:text-emerald-200">{file.name} (new)</span>
              <button type="button" onClick={() => setNewFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="shrink-0 rounded px-2 py-1 font-semibold text-rose-700 hover:bg-rose-100 dark:text-rose-300 dark:hover:bg-rose-950/50">Remove</button>
            </li>
          ))}
        </ul>
        <input type="file" multiple={!isPrinting} accept={isPrinting ? 'application/pdf,.pdf' : '.pdf,.jpg,.jpeg,.png'} onChange={(event) => addFiles(event.target.files)} className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0F2C59] file:px-3 file:py-2 file:font-semibold file:text-white dark:text-slate-300" />
      </fieldset>

      <label className="block space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
        Reason for this change *
        <textarea required minLength={5} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className={fieldClass} placeholder="Tell us why you are updating this request." />
      </label>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={isSaving} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Back</button>
        <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-[#0F2C59] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save changes
        </button>
      </div>
    </form>
  );
}

export const ResidentAccountView: React.FC<{
  user: User | null;
  authReady: boolean;
  onSignOut: () => Promise<void>;
  initialTab?: DashboardTab;
  onReturnToPublic: (page?: 'home' | 'services') => void;
}> = ({ user, authReady, onSignOut, initialTab = 'overview', onReturnToPublic }) => {
  const [applications, setApplications] = useState<ResidentApplication[]>([]);
  const [applicationClaims, setApplicationClaims] = useState<Awaited<ReturnType<typeof getResidentApplicationClaims>>>([]);
  const [history, setHistory] = useState<ApplicationEditHistory[]>([]);
  const [profile, setProfile] = useState<ResidentProfile>(() => getResidentProfile(user));
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimRefNumber, setClaimRefNumber] = useState('');
  const [claimContactNumber, setClaimContactNumber] = useState('');
  const [editingApplicationId, setEditingApplicationId] = useState('');
  const [cancellingApplication, setCancellingApplication] = useState<ResidentApplication | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery'
  );
  const isAdminAccount = isAdminUser(user);

  const sortedHistory = useMemo(() => history.reduce<Record<string, ApplicationEditHistory[]>>((grouped, item) => {
    (grouped[item.application_id] ??= []).push(item);
    return grouped;
  }, {}), [history]);

  const refresh = async () => {
    if (!user) return;
    setIsLoading(true);
    setError('');
    try {
      const [nextApplications, nextClaims, nextHistory] = await Promise.all([
        getResidentApplications(),
        getResidentApplicationClaims(),
        getApplicationEditHistory(),
      ]);
      setApplications(nextApplications);
      setApplicationClaims(nextClaims);
      setHistory(nextHistory);
    } catch (requestError) {
      setError(getUserFacingError(requestError, 'Your account information could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    let isActive = true;
    const unsubscribe = subscribeToResidentApplications(user.id, () => {
      void getResidentApplications()
        .then((nextApplications) => {
          if (isActive) setApplications(nextApplications);
        })
        .catch((requestError: unknown) => {
          if (isActive) {
            setError(getUserFacingError(requestError, 'Application status notifications could not be refreshed.'));
          }
        });
    }, (subscriptionError) => {
      if (isActive) setError(getUserFacingError(subscriptionError, 'Application status notifications could not be connected.'));
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    setProfile(getResidentProfile(user));
  }, [user]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (authReady && isAdminAccount) {
      window.location.replace('/admin');
    } else if (authReady && !user && !isPasswordRecovery) {
      window.location.replace('/admin/login?mode=resident');
    }
  }, [authReady, isAdminAccount, isPasswordRecovery, user]);

  const selectTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    params.set('page', 'account');
    params.set('tab', tab);
    window.history.replaceState({}, '', `/?${params.toString()}`);
  };

  const submitApplicationClaim = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsClaiming(true);
    try {
      await submitResidentApplicationClaim(claimRefNumber, claimContactNumber);
      setClaimRefNumber('');
      setClaimContactNumber('');
      await refresh();
      setNotice('Your request was sent to the SK office for verification. The application will appear in your account after an administrator approves the link.');
    } catch (requestError) {
      setError(getUserFacingError(requestError, 'Your application link request could not be submitted.'));
    } finally {
      setIsClaiming(false);
    }
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSavingProfile(true);
    try {
      const savedProfile = await saveResidentProfile(profile);
      setProfile(savedProfile);
      setNotice('Your personal details were saved and will be used to prefill service forms.');
    } catch (requestError) {
      setError(getUserFacingError(requestError, 'Your profile could not be saved.'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const signOutAndReturnHome = async () => {
    setError('');
    try {
      await onSignOut();
      window.location.assign('/');
    } catch (requestError) {
      setError(getUserFacingError(requestError, 'You could not be signed out.'));
    }
  };

  const confirmCancellation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cancellingApplication) return;
    setError('');
    setNotice('');
    try {
      await cancelResidentApplication(cancellingApplication.id, cancelReason);
      setCancellingApplication(null);
      setCancelReason('');
      setNotice('Your application was cancelled.');
      await refresh();
    } catch (requestError) {
      setError(getUserFacingError(requestError, 'The application could not be cancelled.'));
    }
  };

  if (!authReady) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-500">Checking your account…</div>;
  }

  if (isPasswordRecovery) {
    return (
      <div className="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
        <ResidentAuthPanel onAuthenticated={() => window.location.assign('/?page=account')} />
      </div>
    );
  }

  if (isAdminAccount) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-500">Redirecting to the administrator dashboard…</div>;
  }

  if (!user) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-slate-500">Redirecting to sign in…</div>;
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || user.email || 'Resident';
  const pendingCount = applications.filter((application) => application.status === 'Pending' || application.status === 'Under Review').length;
  const completedCount = applications.filter((application) => application.status === 'Approved').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-24">
        <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F2C59] text-amber-300"><UserRound className="h-5 w-5" /></div>
          <p className="mt-3 truncate font-bold text-slate-900 dark:text-white">{displayName}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
        <nav aria-label="Resident dashboard" className="mt-4 space-y-1">
          {dashboardTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => selectTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#0F2C59]/10 font-semibold text-[#0F2C59] dark:text-amber-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </nav>
        <button type="button" onClick={() => onReturnToPublic('home')} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300">
          <Home className="h-4 w-4" />Back to home
        </button>
        <button type="button" onClick={() => void signOutAndReturnHome()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <LogOut className="h-4 w-4" />Sign out
        </button>
      </aside>

      <main id="dashboard" className="min-w-0 space-y-5">
      <Reveal className="rounded-2xl bg-[#0F2C59] p-6 text-white shadow-md sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300">
              <ShieldCheck className="h-4 w-4" />
              Resident account
            </div>
            <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">Your dashboard</h1>
            <p className="mt-2 text-sm text-slate-200">Your account dashboard for applications, profile details, and updates.</p>
          </div>
        </div>
      </Reveal>

      {activeTab === 'overview' && <div aria-label="Application summary" className="grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Total requests', value: applications.length },
          { label: 'In progress', value: pendingCount },
          { label: 'Approved', value: completedCount },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-[#0F2C59] dark:text-white">{item.value}</p>
          </article>
        ))}
      </div>}

          {activeTab === 'applications' && <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">{user.email}</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Request staff review to link an existing application submitted before you signed in.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void refresh()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200">
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Refresh
                </button>
              </div>
            </div>
            <form onSubmit={(event) => void submitApplicationClaim(event)} className="mt-4 grid gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-2">
              <label className="space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Application reference number
                <input
                  required
                  minLength={4}
                  maxLength={80}
                  value={claimRefNumber}
                  onChange={(event) => setClaimRefNumber(event.target.value)}
                  className={fieldClass}
                  placeholder="For example, SKB-PRT-2026-0383"
                />
              </label>
              <label className="space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                Contact number used on the application
                <input
                  required
                  minLength={7}
                  maxLength={32}
                  value={claimContactNumber}
                  onChange={(event) => setClaimContactNumber(event.target.value)}
                  className={fieldClass}
                  placeholder="Enter the number exactly as submitted"
                />
              </label>
              <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:col-span-2">
                An SK administrator will verify the request before linking it. A matching name or contact number alone does not grant account access.
              </p>
              <div className="sm:col-span-2">
                <button type="submit" disabled={isClaiming} className="inline-flex items-center gap-2 rounded-lg bg-[#0F2C59] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                  {isClaiming && <Loader2 className="h-4 w-4 animate-spin" />}
                  Request application link
                </button>
              </div>
            </form>

            {applicationClaims.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Link request history</h3>
                {applicationClaims.map((claim) => (
                  <div key={claim.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{claim.ref_number}</span>
                    <span className={`rounded-full px-2 py-1 font-bold ${
                      claim.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : claim.status === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>{claim.status}</span>
                    <span className="text-slate-500 dark:text-slate-400">{formatApplicationUpdatedAt(claim.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>}

          {activeTab === 'profile' && <div id="profile" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4">
              <h2 className="font-bold text-slate-900 dark:text-white">Personal details</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Saved details can prefill your service and KK profiling forms. You can still review each form before submitting.</p>
            </div>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {([
                  ['firstName', 'First name'],
                  ['middleName', 'Middle name'],
                  ['lastName', 'Last name'],
                  ['contactNumber', 'Contact number'],
                  ['birthday', 'Birthday'],
                  ['genderIdentity', 'Gender identity'],
                  ['sitioAddress', 'Street / sitio'],
                  ['completeAddress', 'Complete address'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="block space-y-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {label}
                    {key === 'genderIdentity' ? (
                      <select value={profile.genderIdentity} onChange={(event) => setProfile((current) => ({ ...current, genderIdentity: event.target.value }))} className={fieldClass}>
                        <option value="">Select (optional)</option>
                        {['MALE', 'FEMALE', 'GAY', 'LESBIAN', 'BISEXUAL', 'Prefer not to say'].map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    ) : (
                      <input
                        type={key === 'birthday' ? 'date' : 'text'}
                        value={profile[key]}
                        onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))}
                        className={fieldClass}
                      />
                    )}
                  </label>
                ))}
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={isSavingProfile} className="inline-flex items-center gap-2 rounded-lg bg-[#0F2C59] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  {isSavingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save personal details
                </button>
              </div>
            </form>
          </div>}

          {activeTab === 'notifications' && <section id="notifications" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Application status updates</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  Updates here come directly from the status set by the SK office. You do not need email notifications.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />Loading your status updates…
              </div>
            ) : applications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                <Bell className="mx-auto h-8 w-8 text-slate-400" />
                <h3 className="mt-3 font-bold text-slate-900 dark:text-white">No application updates yet</h3>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">When you submit a request, its current status will appear here.</p>
              </div>
            ) : (
              <div aria-live="polite" className="space-y-3">
                {applications.map((application) => (
                  <article key={application.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white">{application.serviceType}</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Reference: {application.refNumber || 'Not available'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${getApplicationStatusClasses(application.status)}`}>
                        {application.status === 'Approved' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {application.status === 'Rejected' && <XCircle className="h-3.5 w-3.5" />}
                        {(application.status === 'Pending' || application.status === 'Under Review') && <Clock3 className="h-3.5 w-3.5" />}
                        {application.status === 'Cancelled' && <AlertCircle className="h-3.5 w-3.5" />}
                        {application.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{getApplicationStatusMessage(application.status)}</p>
                    {application.adminNotes && (
                      <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <span className="font-semibold">Note from the SK office: </span>{application.adminNotes}
                      </p>
                    )}
                    <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Last updated {formatApplicationUpdatedAt(application.updatedAt)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>}

          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
          {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{notice}</p>}

          {activeTab === 'track' && <TrackRequestView onNavigateToServices={() => onReturnToPublic('services')} />}

          {activeTab === 'applications' && <div id="applications" className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">My applications</h2>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-5 w-5 animate-spin" />Loading your applications…</div>
          ) : applications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <Clock3 className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-3 font-bold text-slate-900 dark:text-white">No linked applications yet</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">You can still submit public service forms without an account, or search for previous applications made with this verified email.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <article key={application.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  {editingApplicationId === application.id ? (
                    <ApplicationEditor
                      application={application}
                      onCancel={() => setEditingApplicationId('')}
                      onSaved={async (warning) => {
                        setEditingApplicationId('');
                        setNotice(warning || 'Your application changes were saved.');
                        await refresh();
                      }}
                    />
                  ) : cancellingApplication?.id === application.id ? (
                    <form onSubmit={confirmCancellation} className="space-y-4">
                      <h2 className="font-bold text-slate-900 dark:text-white">Cancel {application.refNumber}?</h2>
                      <label className="block space-y-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Reason for cancellation *
                        <textarea required minLength={5} maxLength={1000} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} rows={3} className={fieldClass} />
                      </label>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setCancellingApplication(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-700">Keep application</button>
                        <button type="submit" className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-bold text-white">Confirm cancellation</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{application.serviceType}</p>
                          <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{application.applicantName}</h2>
                          <p className="mt-1 font-mono text-sm text-[#0F2C59] dark:text-amber-300">{application.refNumber}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          application.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : application.status === 'Rejected' || application.status === 'Cancelled' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}>{application.status}</span>
                      </div>
                      <div className="mt-4 grid gap-3 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                        <p><span className="block text-slate-400">Submitted</span>{application.submittedAt}</p>
                        <p><span className="block text-slate-400">Last updated</span>{new Date(application.updatedAt).toLocaleString()}</p>
                        <p><span className="block text-slate-400">Email on request</span>{getApplicationEmail(application) || 'Not provided'}</p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {application.status === 'Pending' && (
                          <>
                            <button type="button" onClick={() => setEditingApplicationId(application.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2C59] px-3 py-2 text-xs font-bold text-white">
                              <Pencil className="h-3.5 w-3.5" /> Edit request
                            </button>
                            <button type="button" onClick={() => { setCancellingApplication(application); setCancelReason(''); }} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-900 dark:text-rose-300">
                              <Trash2 className="h-3.5 w-3.5" /> Cancel request
                            </button>
                          </>
                        )}
                      </div>
                      {(sortedHistory[application.id]?.length ?? 0) > 0 && (
                        <details className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                          <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">Edit history</summary>
                          <ul className="mt-2 space-y-2">
                            {sortedHistory[application.id].map((entry) => (
                              <li key={entry.id} className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800">
                                <span className="font-semibold">{new Date(entry.created_at).toLocaleString()}</span>
                                <p className="mt-1">{entry.reason}</p>
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {application.status === 'Cancelled' && <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4" />Cancelled by you.</p>}
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
          </div>}
      </main>
      </div>
    </div>
  );
};
