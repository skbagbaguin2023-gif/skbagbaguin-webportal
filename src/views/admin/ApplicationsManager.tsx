import React, { useState } from 'react';
import { YouthApplication, ApplicationStatus, YouthService } from '../../types/index.ts';
import { 
  Search, 
  Filter, 
  FileCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  ShieldCheck, 
  MessageSquare, 
  ExternalLink,
  Save,
  Check,
  Trash2
} from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';
import { getApplicationDocumentSignedUrl, syncKkProfileToGoogle } from '../../services/supabaseData.ts';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal.tsx';

interface ApplicationsManagerProps {
  applications: YouthApplication[];
  services: YouthService[];
  onUpdateStatus: (id: string, status: ApplicationStatus, notes?: string) => void;
  onDeleteApplication: (id: string) => Promise<void>;
  selectedApplicationId?: string | null;
}

export const ApplicationsManager: React.FC<ApplicationsManagerProps> = ({
  applications,
  services,
  onUpdateStatus,
  onDeleteApplication,
  selectedApplicationId,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterService, setFilterService] = useState<string>('All');

  const [activeApp, setActiveApp] = useState<YouthApplication | undefined>(
    applications.find((a) => a.id === selectedApplicationId) || applications[0]
  );

  const [adminNotes, setAdminNotes] = useState(activeApp?.adminNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState<string | null>(
    activeApp?.documentsAttached[0]?.name || null
  );
  const [selectedDocUrl, setSelectedDocUrl] = useState('');
  const [documentError, setDocumentError] = useState('');
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isSyncingKkProfile, setIsSyncingKkProfile] = useState(false);
  const [kkSyncMessage, setKkSyncMessage] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingApplication, setIsDeletingApplication] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const filtered = applications.filter((app) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      app.applicantName.toLowerCase().includes(q) ||
      app.refNumber.toLowerCase().includes(q) ||
      (app.sitio || app.address).toLowerCase().includes(q);

    const matchStatus = filterStatus === 'All' || app.status === filterStatus;
    const matchService = filterService === 'All' || app.serviceType === filterService;

    return matchQ && matchStatus && matchService;
  });

  const handleSelectApp = (app: YouthApplication) => {
    setActiveApp(app);
    setAdminNotes(app.adminNotes || '');
    setSelectedDocPreview(app.documentsAttached[0]?.name || null);
    setSelectedDocUrl('');
    setDocumentError('');
    setSavedSuccess(false);
    setKkSyncMessage('');
  };

  const handleKkSync = async () => {
    if (!activeApp) return;
    setIsSyncingKkProfile(true);
    setKkSyncMessage('');
    try {
      await syncKkProfileToGoogle(activeApp.id);
      setActiveApp({ ...activeApp, googleSyncStatus: 'Synced', googleSyncError: '' });
      setKkSyncMessage('This KK profile is synchronized with the Google Form.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not synchronize the KK profile.';
      setActiveApp({ ...activeApp, googleSyncStatus: 'Failed', googleSyncError: message });
      setKkSyncMessage(message);
    } finally {
      setIsSyncingKkProfile(false);
    }
  };

  const handleLoadDocument = async () => {
    const document = activeApp?.documentsAttached.find((item) => item.name === selectedDocPreview);
    if (!document?.storagePath) {
      setDocumentError('This record has no stored document. Applicants who submitted before file uploads were enabled have filename-only records.');
      return;
    }

    setIsLoadingDocument(true);
    setDocumentError('');
    try {
      setSelectedDocUrl(await getApplicationDocumentSignedUrl(document.storagePath));
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : 'Could not create a secure document link.');
    } finally {
      setIsLoadingDocument(false);
    }
  };

  const handleStatusChange = (newStatus: ApplicationStatus) => {
    if (!activeApp) return;
    onUpdateStatus(activeApp.id, newStatus, adminNotes);
    setActiveApp({
      ...activeApp,
      status: newStatus,
      adminNotes,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSaveNotes = () => {
    if (!activeApp) return;
    onUpdateStatus(activeApp.id, activeApp.status, adminNotes);
    setActiveApp({
      ...activeApp,
      adminNotes,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDeleteApplication = async () => {
    if (!activeApp) return;
    setIsDeletingApplication(true);
    setDeleteError('');
    try {
      await onDeleteApplication(activeApp.id);
      const nextApplication = applications.find((application) => application.id !== activeApp.id);
      setActiveApp(nextApplication);
      setAdminNotes(nextApplication?.adminNotes || '');
      setSelectedDocPreview(nextApplication?.documentsAttached[0]?.name || null);
      setSelectedDocUrl('');
      setDocumentError('');
      setSavedSuccess(false);
      setKkSyncMessage('');
      setIsDeleteConfirmOpen(false);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not delete this application.');
    } finally {
      setIsDeletingApplication(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Youth Applications & Profiling Review</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Audit applicant requirements, verify residency, and issue approval or release orders
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold px-2.5 py-1 rounded-md">
            {applications.filter((a) => a.status === 'Pending' || a.status === 'Under Review').length} In Queue
          </span>
          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-md">
            {applications.filter((a) => a.status === 'Approved').length} Approved
          </span>
        </div>
      </Reveal>

      {/* Main Split Layout: Queue list (left) & Detailed Review + Document Previewer (right) */}
      <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Applications List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[750px]">
          
          {/* List Search & Filters */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, ref code, or sitio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-1/2 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px]"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Under Review">Under Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="w-1/2 px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px]"
              >
                <option value="All">All Services</option>
                {[...new Set([...services.map((service) => service.name), ...applications.map((app) => app.serviceType)])]
                  .filter(Boolean)
                  .map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((app) => {
              const isSelected = activeApp?.id === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => handleSelectApp(app)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-l-[#0F2C59] dark:border-l-amber-400' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-[#0F2C59] dark:text-amber-400">{app.refNumber}</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                      app.status === 'Approved'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                        : app.status === 'Under Review'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : app.status === 'Rejected'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <div className="font-bold text-slate-900 dark:text-white">{app.applicantName}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{app.serviceType}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    <span>{app.sitio || app.address}</span>
                    <span className="font-mono">{app.submittedAt.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Detailed Review & Document Viewer (7 cols) */}
        {activeApp ? (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 block">
                  {activeApp.refNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeApp.applicantName}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{activeApp.serviceType}</p>
              </div>

              {/* Status Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteError('');
                    setIsDeleteConfirmOpen(true);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => handleStatusChange('Approved')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleStatusChange('Under Review')}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hold Review</span>
                </button>
                <button
                  onClick={() => handleStatusChange('Rejected')}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>

            {deleteError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {deleteError}
              </p>
            )}

            {savedSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Application status and notes updated in official database.</span>
              </div>
            )}

            {activeApp.kkProfile && (
              <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">Katipunan ng Kabataan Profile</h4>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                    activeApp.googleSyncStatus === 'Synced'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : activeApp.googleSyncStatus === 'Failed'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    Google sync: {activeApp.googleSyncStatus || 'Pending'}
                  </span>
                </div>
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  {Object.entries({
                    'Email': activeApp.kkProfile.email,
                    'Name': `${activeApp.kkProfile.firstName} ${activeApp.kkProfile.middleName} ${activeApp.kkProfile.lastName}`.replace(/\s+/g, ' ').trim(),
                    'Sex / gender identity': activeApp.kkProfile.genderIdentity,
                    'Age / birthday': `${activeApp.kkProfile.age} · ${activeApp.kkProfile.birthday}`,
                    'Birthplace': activeApp.kkProfile.birthplace,
                    'Civil status': activeApp.kkProfile.civilStatus,
                    'Street / sitio': activeApp.kkProfile.sitioAddress === 'Iba pa:'
                      ? activeApp.kkProfile.sitioOther
                      : activeApp.kkProfile.sitioAddress,
                    'Complete address': activeApp.kkProfile.completeAddress,
                    'Voter status': activeApp.kkProfile.voterStatus,
                    'Voted in last SK election': activeApp.kkProfile.votedLastSkElection,
                    'SK election vote count': activeApp.kkProfile.skElectionVoteCount,
                    'National voter': activeApp.kkProfile.nationalVoter,
                    'Precinct number': activeApp.kkProfile.precinctNumber || 'Not provided',
                    'Youth classifications': activeApp.kkProfile.youthClassifications.join(', '),
                    'Work status': activeApp.kkProfile.workStatus,
                    'Educational background': activeApp.kkProfile.educationalBackground,
                  }).map(([label, value]) => (
                    <p key={label} className="break-words text-slate-600 dark:text-slate-300">
                      <strong className="text-slate-800 dark:text-slate-100">{label}:</strong> {value}
                    </p>
                  ))}
                </div>
                {kkSyncMessage && <p role="status" className="text-xs text-amber-800 dark:text-amber-300">{kkSyncMessage}</p>}
                {activeApp.googleSyncStatus !== 'Synced' && (
                  <button
                    type="button"
                    disabled={isSyncingKkProfile}
                    onClick={() => void handleKkSync()}
                    className="rounded-lg bg-[#0F2C59] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {isSyncingKkProfile ? 'Synchronizing...' : 'Retry Google Sync'}
                  </button>
                )}
              </section>
            )}

            {/* Applicant Profile Data Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              {activeApp.serviceType === 'Printing Services' ? (
                <>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 block text-[11px]">Requested Date</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{activeApp.requestedDate}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 block text-[11px]">Date Needed</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{activeApp.dateNeeded}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 block text-[11px]">Copies Needed</span>
                    <strong className="text-slate-800 dark:text-slate-200">{activeApp.copiesNeeded}</strong>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-slate-400 dark:text-slate-400 block text-[11px]">Full Address</span>
                    <strong className="text-slate-800 dark:text-slate-200">{activeApp.address}</strong>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 block text-[11px]">Age & Gender</span>
                    <strong className="text-slate-800 dark:text-slate-200">{activeApp.age} yrs · {activeApp.gender}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 block text-[11px]">Date of Birth</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">{activeApp.birthday}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 block text-[11px]">Resident Sitio</span>
                    <strong className="text-slate-800 dark:text-slate-200">{activeApp.sitio}</strong>
                  </div>
                </>
              )}
              <div>
                <span className="text-slate-400 dark:text-slate-400 block text-[11px]">Contact Mobile</span>
                <strong className="text-slate-800 dark:text-slate-200 font-mono">{activeApp.contactNumber}</strong>
              </div>
              {activeApp.serviceType !== 'Printing Services' && (
                <>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 block text-[11px]">Email Address</span>
                    <strong className="text-slate-800 dark:text-slate-200 truncate block">{activeApp.email}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-400 block text-[11px]">School / Affiliation</span>
                    <strong className="text-slate-800 dark:text-slate-200 truncate block">{activeApp.schoolOrOrg || 'N/A'}</strong>
                  </div>
                </>
              )}
            </div>

            {/* Purpose or notes */}
            {activeApp.details && (
              <div className="text-xs space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Applicant Stated Purpose:</span>
                <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  {activeApp.details}
                </p>
              </div>
            )}

            {/* Side-by-Side Document Reviewer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                <span>Submitted Documents ({activeApp.documentsAttached.length})</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 normal-case text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Residency Validated</span>
                </span>
              </div>

              {/* Document Tabs */}
              <div className="flex flex-wrap gap-2 text-xs">
                {activeApp.documentsAttached.map((doc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedDocPreview(doc.name);
                      setSelectedDocUrl('');
                      setDocumentError('');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      selectedDocPreview === doc.name
                        ? 'bg-[#0F2C59] dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[150px]">{doc.name}</span>
                  </button>
                ))}
              </div>

              {/* Document Preview Box */}
              <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-5 text-center space-y-3">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-300 dark:border-slate-700 mx-auto flex items-center justify-center text-[#0F2C59] dark:text-amber-400">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{selectedDocPreview || 'No document selected'}</div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Scanned electronic document submitted via Katipunan ng Kabataan Portal
                  </p>
                </div>
                {selectedDocPreview && (
                  <button
                    type="button"
                    onClick={() => void handleLoadDocument()}
                    disabled={isLoadingDocument}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#0F2C59] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{isLoadingDocument ? 'Preparing secure link...' : 'Open secure document'}</span>
                  </button>
                )}
                {selectedDocUrl && (
                  <a
                    href={selectedDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs font-semibold text-emerald-700 underline dark:text-emerald-400"
                  >
                    Open document
                  </a>
                )}
                {documentError && <p role="alert" className="text-xs text-rose-600">{documentError}</p>}
              </div>
            </div>

            {/* Admin Notes Section */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Internal Council Evaluation Notes
              </label>
              <textarea
                rows={3}
                placeholder="Log verification remarks, COA batch payroll notes, or requirement deficiency notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            Select an application to view full details and documentation.
          </div>
        )}

      </Reveal>

      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        title="Delete application record?"
        message={activeApp
          ? `Permanently delete ${activeApp.refNumber} for ${activeApp.applicantName}? Any stored uploaded documents will also be removed. This action cannot be undone.`
          : 'Permanently delete this application record? This action cannot be undone.'}
        confirmLabel="Delete Application"
        isLoading={isDeletingApplication}
        onConfirm={handleDeleteApplication}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteError('');
        }}
      />

    </div>
  );
};
