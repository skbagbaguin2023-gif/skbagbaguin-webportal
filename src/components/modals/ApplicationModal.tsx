import React, { useEffect, useState } from 'react';
import { NotificationPreference, ServiceType, YouthApplication, YouthService } from '../../types/index.ts';
import { validateYouthApplication, generateApplicationRef } from '../../utils/portalLogic.ts';
import { 
  X, 
  CheckCircle2, 
  Upload, 
  FileCheck, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft,
  Copy,
  Check,
  Download,
  Printer,
  Sparkles
} from 'lucide-react';
import { uploadApplicationDocument, uploadPrintingRequestPdf } from '../../services/supabaseData.ts';
import { ConfirmationModal } from './ConfirmationModal.tsx';
import { generateUuid } from '../../utils/uuid.ts';
import { KkProfilingForm } from './KkProfilingForm.tsx';
import { validatePrintingRequest } from '../../utils/printingLogic.ts';
import { useModalScrollLock } from '../useModalScrollLock.ts';

const getLocalDateString = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: ServiceType;
  services: YouthService[];
  onSubmitApplication: (app: YouthApplication) => Promise<void>;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  defaultService = '',
  services,
  onSubmitApplication,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [serviceType, setServiceType] = useState<ServiceType>(defaultService);
  const [applicantName, setApplicantName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [sitio, setSitio] = useState('');
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [notificationPreference, setNotificationPreference] = useState<NotificationPreference>('Messenger');
  const [messengerName, setMessengerName] = useState('');
  const [messengerProfileUrl, setMessengerProfileUrl] = useState('');
  const [email, setEmail] = useState('');
  const [schoolOrOrg, setSchoolOrOrg] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [details, setDetails] = useState('');
  const [requestedDate, setRequestedDate] = useState('');
  const [dateNeeded, setDateNeeded] = useState('');
  const [copiesNeeded, setCopiesNeeded] = useState<number | ''>('');
  const [printingPdf, setPrintingPdf] = useState<File | null>(null);
  const [dataPrivacyConsent, setDataPrivacyConsent] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const isPrintingService = serviceType.toLowerCase().includes('printing');
  const isKkProfilingService = serviceType.toLowerCase().includes('profiling');
  const activeServices = services.filter((service) => service.isActive);
  useModalScrollLock(isOpen);

  useEffect(() => {
    const activeServices = services.filter((service) => service.isActive);
    const preferredService = activeServices.find((service) => service.name === defaultService);
    if (preferredService) {
      setServiceType(preferredService.name);
    } else if (!activeServices.some((service) => service.name === serviceType)) {
      setServiceType(activeServices[0]?.name ?? '');
    }
  }, [defaultService, services]);

  const handleServiceChange = (nextService: string) => {
    setServiceType(nextService as ServiceType);
    setPrintingPdf(null);
    setUploadedFiles([]);
    setErrors({});
    setStep(1);
  };

  if (!isOpen) return null;
  if (isKkProfilingService) {
    return (
      <KkProfilingForm
        onClose={onClose}
        services={services}
        serviceType={serviceType}
        onServiceChange={handleServiceChange}
        onSubmitApplication={onSubmitApplication}
      />
    );
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (!applicantName.trim()) {
        setErrors({ applicantName: 'Full legal name is required.' });
        return;
      }
      setErrors({});
      setStep(2);
    } else if (step === 2) {
      const val = validateYouthApplication({
        applicantName,
        age,
        sitio,
        contactNumber,
        email,
        serviceType,
        dataPrivacyConsent: true, // will check on step 3
      });
      if (!val.isValid) {
        setErrors(val.errors);
        return;
      }
      setErrors({});
      setStep(3);
    }
  };

  const addSelectedFiles = (files: FileList | File[]) => {
    const accepted: File[] = [];
    const nextErrors: Record<string, string> = {};
    const currentFiles = [...uploadedFiles];

    for (const file of Array.from(files)) {
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        nextErrors.files = 'Choose PDF, JPG, or PNG files only.';
        continue;
      }
      if (file.size === 0) {
        nextErrors.files = 'Empty files cannot be attached.';
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        nextErrors.files = 'Each document must be 10 MB or smaller.';
        continue;
      }
      if ([...currentFiles, ...accepted].some((current) => current.name === file.name && current.size === file.size && current.lastModified === file.lastModified)) {
        continue;
      }
      if (currentFiles.length + accepted.length >= 10) {
        nextErrors.files = 'You can attach up to 10 documents.';
        break;
      }
      accepted.push(file);
    }

    setUploadedFiles((current) => [...current, ...accepted]);
    setErrors((current) => ({
      ...current,
      files: nextErrors.files ?? (accepted.length ? '' : current.files),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!services.some((service) => service.isActive && service.name === serviceType)) {
      setErrors({ submit: 'This service is no longer available. Please choose an active service.' });
      return;
    }
    if (isPrintingService) {
      const nextErrors = validatePrintingRequest({
        applicantName,
        requestedDate,
        dateNeeded,
        copiesNeeded,
        purpose: details,
        address,
        contactNumber,
        pdf: printingPdf ?? undefined,
        today: getLocalDateString(),
      });
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }
      if (notificationPreference === 'Messenger' && !messengerName.trim() && !messengerProfileUrl.trim()) {
        setErrors({ messengerContact: 'Provide your Messenger name or Facebook profile URL.' });
        return;
      }
      if (messengerProfileUrl.trim()) {
        try {
          const profileUrl = new URL(messengerProfileUrl.trim());
          const hostname = profileUrl.hostname.toLowerCase();
          const isFacebookHost = hostname === 'facebook.com' || hostname.endsWith('.facebook.com');
          if (!['http:', 'https:'].includes(profileUrl.protocol) || !isFacebookHost || !profileUrl.pathname || profileUrl.pathname === '/') {
            setErrors({ messengerProfileUrl: 'Enter a valid Facebook profile URL, such as https://www.facebook.com/your.profile.' });
            return;
          }
        } catch {
          setErrors({ messengerProfileUrl: 'Enter a valid Facebook profile URL, such as https://www.facebook.com/your.profile.' });
          return;
        }
      }
      setErrors({});
      setIsSubmitConfirmOpen(true);
      return;
    }
    const val = validateYouthApplication({
      applicantName,
      age,
      sitio,
      contactNumber,
      email,
      serviceType,
      dataPrivacyConsent,
    });

    if (!val.isValid) {
      setErrors(val.errors);
      return;
    }

    setErrors({});
    setIsSubmitConfirmOpen(true);
  };

  const submitApplication = async () => {
    setIsSubmitting(true);
    try {
      const documentsAttached: YouthApplication['documentsAttached'] = [];
      const filesToUpload = isPrintingService && printingPdf
        ? [printingPdf]
        : uploadedFiles;
      for (const file of filesToUpload) {
        const storagePath = isPrintingService
          ? await uploadPrintingRequestPdf(file)
          : await uploadApplicationDocument(file);
        documentsAttached.push({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          status: 'Pending Review',
          storagePath,
        });
      }

      const newRef = generateApplicationRef(serviceType, Math.floor(100 + Math.random() * 900));
      const now = new Date();
      const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newApp: YouthApplication = {
        id: `app-${generateUuid()}`,
        refNumber: newRef,
        applicantName: applicantName.trim(),
        ...(isPrintingService ? {} : { age: Number(age) }),
        ...(isPrintingService
          ? {
              address: address.trim(),
              contactNumber: contactNumber.replace(/[\s-]/g, ''),
              notificationPreference,
              ...(messengerName.trim() ? { messengerName: messengerName.trim() } : {}),
              ...(messengerProfileUrl.trim() ? { messengerProfileUrl: messengerProfileUrl.trim() } : {}),
            }
          : {
              birthday,
              gender,
              sitio,
              address: address || `${sitio}, Barangay Bagbaguin`,
              contactNumber,
              email,
            }),
        serviceType,
        ...(isPrintingService
          ? {
              requestedDate,
              dateNeeded,
              copiesNeeded: Number(copiesNeeded),
              details: details.trim(),
            }
          : {
              schoolOrOrg: schoolOrOrg || 'Pamantasan ng Lungsod ng Valenzuela (PLV)',
              yearLevel: yearLevel || 'College Student',
              details: details || 'Official online application via SK Bagbaguin Youth Portal.',
            }),
        status: 'Pending',
        submittedAt: formattedDate,
        adminNotes: 'New online portal submission. Verification required.',
        documentsAttached,
      };

      await onSubmitApplication(newApp);
      setSubmittedRef(newRef);
      setStep(4);
      setIsSubmitConfirmOpen(false);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'Your application could not be submitted. Please try again.';
      setErrors({
        submit: message,
      });
      setIsSubmitConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (size: number) => size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
    setStep(1);
    setApplicantName('');
    setAge('');
    setBirthday('');
    setGender('');
    setSitio('');
    setAddress('');
    setContactNumber('');
    setEmail('');
    setSchoolOrOrg('');
    setYearLevel('');
    setDetails('');
    setRequestedDate('');
    setDateNeeded('');
    setCopiesNeeded('');
    setPrintingPdf(null);
    setDataPrivacyConsent(false);
    setUploadedFiles([]);
    setErrors({});
    setSubmittedRef(null);
    setIsSubmitConfirmOpen(false);
  };

  const handleCopyRef = () => {
    if (submittedRef) {
      navigator.clipboard.writeText(submittedRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createReceiptImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = isPrintingService ? 900 : 720;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Receipt image could not be created.');

    const navy = '#0F2C59';
    const gold = '#F5A623';
    const ink = '#172033';
    const muted = '#64748B';
    context.fillStyle = '#F8FAFC';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = navy;
    context.fillRect(0, 0, canvas.width, 190);
    context.fillStyle = gold;
    context.fillRect(0, 0, 18, canvas.height);

    context.fillStyle = '#FFFFFF';
    context.font = 'bold 24px Arial';
    context.fillText('SANGGUNIANG KABATAAN NG BARANGAY BAGBAGUIN', 70, 65);
    context.font = 'bold 42px Arial';
    context.fillText('SERVICE REQUEST RECEIPT', 70, 130);

    context.fillStyle = '#FFFFFF';
    context.fillRect(70, 230, 1060, 130);
    context.strokeStyle = '#CBD5E1';
    context.lineWidth = 2;
    context.strokeRect(70, 230, 1060, 130);
    context.fillStyle = muted;
    context.font = 'bold 20px Arial';
    context.fillText('OFFICIAL APPLICATION REFERENCE CODE', 100, 275);
    context.fillStyle = navy;
    context.font = 'bold 38px monospace';
    context.fillText(submittedRef ?? '', 100, 330);

    const rows = [
      ['Applicant', applicantName],
      ['Service', serviceType],
      ...(isPrintingService ? [
        ['Requested date', requestedDate],
        ['Date needed', dateNeeded],
        ['Copies', String(copiesNeeded)],
        ['Preferred notification', notificationPreference],
        ...(messengerName.trim() ? [['Messenger name', messengerName.trim()]] : []),
        ...(messengerProfileUrl.trim() ? [['Facebook profile', messengerProfileUrl.trim()]] : []),
      ] : [['Sitio', sitio]]),
      ['Initial status', 'Under Evaluation'],
    ];
    let y = 410;
    context.font = '22px Arial';
    rows.forEach(([label, value]) => {
      context.fillStyle = muted;
      context.fillText(`${label}:`, 100, y);
      context.fillStyle = ink;
      context.font = 'bold 22px Arial';
      context.fillText(value, 390, y);
      context.font = '22px Arial';
      y += 42;
    });

    context.fillStyle = '#E2E8F0';
    context.fillRect(70, canvas.height - 105, 1060, 1);
    context.fillStyle = muted;
    context.font = '20px Arial';
    context.fillText('Keep this receipt and your reference code for request tracking.', 70, canvas.height - 55);
    return canvas.toDataURL('image/png');
  };

  const handleDownloadReceipt = () => {
    const url = createReceiptImage();
    const link = document.createElement('a');
    link.href = url;
    link.download = `${submittedRef ?? 'service-request'}-receipt.png`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    const imageUrl = createReceiptImage();
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=720,height=720');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>${submittedRef ?? 'Service Request'} Receipt</title><style>body{margin:0;padding:24px;text-align:center}img{max-width:100%;height:auto}</style></head><body><img src="${imageUrl}" alt="SK Bagbaguin service request receipt"></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    const image = printWindow.document.querySelector('img');
    image?.addEventListener('load', () => printWindow.print());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-hidden"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) handleClose();
      }}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
        
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 bg-gradient-to-r from-[#081830] via-[#0F2C59] to-[#173B72] px-5 py-4 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-300/30 bg-white/10 text-amber-300 shadow-inner">
              {isPrintingService ? <Printer className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              Barangay Bagbaguin Youth Assistance Portal
            </div>
            <h2 className="truncate text-lg font-bold">{isPrintingService ? 'Printing Services Request' : 'Online Youth Application Wizard'}</h2>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close application form"
            onClick={handleClose}
            className="shrink-0 rounded-xl border border-white/10 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 4 && !isPrintingService && (
          <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/60 sm:px-6">
            <div className="flex items-center justify-between gap-1 text-[10px] font-medium sm:text-xs">
              <span className={`flex items-center gap-1.5 ${step >= 1 ? 'text-[#0F2C59] dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-[#0F2C59] dark:bg-amber-400 text-white dark:text-slate-950 font-bold' : 'bg-slate-200 dark:bg-slate-700'}`}>1</span>
                Applicant Info
              </span>
              <span className="text-slate-300 dark:text-slate-600">———</span>
              <span className={`flex items-center gap-1.5 ${step >= 2 ? 'text-[#0F2C59] dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-[#0F2C59] dark:bg-amber-400 text-white dark:text-slate-950 font-bold' : 'bg-slate-200 dark:bg-slate-700'}`}>2</span>
                Residency & Contact
              </span>
              <span className="text-slate-300 dark:text-slate-600">———</span>
              <span className={`flex items-center gap-1.5 ${step >= 3 ? 'text-[#0F2C59] dark:text-amber-400 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? 'bg-[#0F2C59] dark:bg-amber-400 text-white dark:text-slate-950 font-bold' : 'bg-slate-200 dark:bg-slate-700'}`}>3</span>
                Upload & Consent
              </span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="application-modal-fields min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {step === 1 && isPrintingService && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-slate-900">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F2C59] text-amber-300 shadow-sm">
                  <Printer className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#0F2C59] dark:text-white">Tell us about your printing request</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Complete the request details and upload your PDF so our team can prepare your materials.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Youth Assistance Program / Service
                </label>
                <select
                  value={serviceType}
                  onChange={(event) => handleServiceChange(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {activeServices.map((service) => (
                    <option key={service.id} value={service.name}>{service.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="printing-applicant-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  id="printing-applicant-name"
                  type="text"
                  maxLength={120}
                  autoComplete="name"
                  value={applicantName}
                  onChange={(event) => setApplicantName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {errors.applicantName && <p role="alert" className="mt-1 text-xs text-rose-600">{errors.applicantName}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="printing-requested-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Date Requested *
                  </label>
                  <input
                    id="printing-requested-date"
                    type="date"
                    min={getLocalDateString()}
                    value={requestedDate}
                    onChange={(event) => setRequestedDate(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {errors.requestedDate && <p role="alert" className="mt-1 text-xs text-rose-600">{errors.requestedDate}</p>}
                </div>
                <div>
                  <label htmlFor="printing-copies" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Copies Needed *
                  </label>
                  <input
                    id="printing-copies"
                    type="number"
                    min="1"
                    max="999999"
                    step="1"
                    value={copiesNeeded}
                    onChange={(event) => setCopiesNeeded(event.target.value ? Number(event.target.value) : '')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {errors.copiesNeeded && <p role="alert" className="mt-1 text-xs text-rose-600">{errors.copiesNeeded}</p>}
                </div>
                <div>
                  <label htmlFor="printing-date-needed" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Date Needed *
                  </label>
                  <input
                    id="printing-date-needed"
                    type="date"
                    min={getLocalDateString()}
                    value={dateNeeded}
                    onChange={(event) => setDateNeeded(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  {errors.dateNeeded && <p role="alert" className="mt-1 text-xs text-rose-600">{errors.dateNeeded}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="printing-purpose" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Purpose of Printing *
                </label>
                <textarea
                  id="printing-purpose"
                  rows={3}
                  maxLength={2000}
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {errors.details && <p role="alert" className="mt-1 text-xs text-rose-600">{errors.details}</p>}
              </div>

              <div>
                <label htmlFor="printing-address" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Address in Barangay Bagbaguin *
                </label>
                <input
                  id="printing-address"
                  type="text"
                  maxLength={300}
                  autoComplete="street-address"
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-slate-500">Printing services are for Barangay Bagbaguin residents.</p>
                {errors.address && <p role="alert" className="mt-1 text-xs text-rose-600">{errors.address}</p>}
              </div>

              <div>
                <label htmlFor="printing-contact" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Contact Number *
                </label>
                <input
                  id="printing-contact"
                  type="tel"
                  maxLength={16}
                  autoComplete="tel"
                  value={contactNumber}
                  onChange={(event) => setContactNumber(event.target.value)}
                  placeholder="09XXXXXXXXX"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {errors.contactNumber && <p role="alert" className="mt-1 text-xs text-rose-600">{errors.contactNumber}</p>}
              </div>

              <div>
                <label htmlFor="printing-notification-preference" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Preferred Notification Method *
                </label>
                <select
                  id="printing-notification-preference"
                  value={notificationPreference}
                  onChange={(event) => setNotificationPreference(event.target.value as NotificationPreference)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Messenger">Messenger (manual notification)</option>
                  <option value="SMS">SMS text message</option>
                  <option value="Phone call">Phone call</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Messenger is the primary manual channel. Your mobile number is retained for SMS or phone-call alternatives.
                </p>
                {notificationPreference === 'Messenger' && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label htmlFor="printing-messenger-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Messenger Name
                      </label>
                      <input
                        id="printing-messenger-name"
                        type="text"
                        maxLength={120}
                        value={messengerName}
                        onChange={(event) => setMessengerName(event.target.value)}
                        placeholder="Name shown on Messenger"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="printing-messenger-url" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Facebook Profile URL
                      </label>
                      <input
                        id="printing-messenger-url"
                        type="url"
                        maxLength={300}
                        value={messengerProfileUrl}
                        onChange={(event) => setMessengerProfileUrl(event.target.value)}
                        placeholder="https://www.facebook.com/your.profile"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    {(errors.messengerContact || errors.messengerProfileUrl) && (
                      <p role="alert" className="text-xs text-rose-600">{errors.messengerContact || errors.messengerProfileUrl}</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="printing-pdf" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  PDF File *
                </label>
                <input
                  id="printing-pdf"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
                      setPrintingPdf(null);
                      setErrors((current) => ({ ...current, files: 'Choose a PDF file only.' }));
                    } else if (file.size === 0 || file.size > 10 * 1024 * 1024) {
                      setPrintingPdf(null);
                      setErrors((current) => ({ ...current, files: 'The PDF must be larger than 0 bytes and 10 MB or smaller.' }));
                    } else {
                      setPrintingPdf(file);
                      setErrors((current) => ({ ...current, files: '' }));
                    }
                    event.target.value = '';
                  }}
                  className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold dark:text-slate-300 dark:file:bg-slate-800"
                />
                <p className="mt-1 text-[11px] text-slate-500">PDF only; maximum file size 10 MB.</p>
                {printingPdf && <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{printingPdf.name}</p>}
                {errors.files && <p role="alert" className="mt-1 text-xs text-rose-600">{errors.files}</p>}
              </div>

              {errors.submit && <p role="alert" className="text-xs text-rose-600">{errors.submit}</p>}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#0F2C59] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-800 disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Printing Request'}
                </button>
              </div>
            </form>
          )}

          {step === 1 && !isPrintingService && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white p-4 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-slate-900">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F2C59] text-amber-300 shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#0F2C59] dark:text-white">Start your youth service application</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    Add your basic information first. You can review your details at each step before submitting.
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Youth Assistance Program / Service
                </label>
                <select
                  value={serviceType}
                  onChange={(event) => handleServiceChange(event.target.value)}
                  disabled={activeServices.length === 0}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                >
                  {activeServices.map((service) => (
                    <option key={service.id} value={service.name}>{service.name}</option>
                  ))}
                </select>
                {activeServices.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    There are currently no active services available.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Legal Name (Apelyido, Pangalan, Gitnang Pangalan) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Maria Angela Santos Delos Reyes"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
                {errors.applicantName && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.applicantName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Age (15-30) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="30"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  />
                  {errors.age && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.age}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  >
                    <option value="">Select gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary / LGBTQ+">Non-binary / LGBTQ+</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    School / University / Employer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pamantasan ng Lungsod ng Valenzuela (PLV)"
                    value={schoolOrOrg}
                    onChange={(e) => setSchoolOrOrg(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Year Level / Strand / Degree
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3rd Year BS Accountancy"
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <span>Next: Residency & Contact</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Resident Sitio (Barangay Bagbaguin) *
                  </label>
                  <input
                    type="text"
                    value={sitio}
                    onChange={(e) => setSitio(e.target.value)}
                    placeholder="Enter your sitio"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  />
                  {errors.sitio && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.sitio}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Philippine Mobile Number (11-digit) *
                  </label>
                  <input
                    type="text"
                    placeholder="09171234567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  />
                  {errors.contactNumber && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">{errors.contactNumber}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  House No. / Street / Compound Address
                </label>
                <input
                  type="text"
                  placeholder="Enter your complete address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address (for Status Notifications) *
                </label>
                <input
                  type="email"
                  placeholder="name@plv.edu.ph or personal email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Purpose / Application Details
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide additional details (e.g. intended use of allowance, equipment booking date, etc.)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>Next: Documents & Privacy</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Document Attachments (Certificate of Registration, ID, Barangay Residency)
                </label>
                
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDraggingFiles(true);
                  }}
                  onDragLeave={(event) => {
                    const nextTarget = event.relatedTarget;
                    if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                      setIsDraggingFiles(false);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDraggingFiles(false);
                    addSelectedFiles(event.dataTransfer.files);
                  }}
                  className={`block cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
                    isDraggingFiles
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                      : 'border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Drag and drop files here, or click to choose
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    PDF, JPG, or PNG; up to 10 MB each and 10 documents total
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) => {
                      if (event.target.files) addSelectedFiles(event.target.files);
                      event.target.value = '';
                    }}
                    className="sr-only"
                  />
                </label>
                {errors.files && <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{errors.files}</p>}

                {/* File list */}
                <div className="mt-3 space-y-1.5">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[280px]">{file.name}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px]">{formatFileSize(file.size)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles((current) => current.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 font-bold cursor-pointer"
                        aria-label={`Remove ${file.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Privacy Act Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-950 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span>Philippine Data Privacy Act of 2012 (R.A. 10173) Consent</span>
                </div>
                <p className="text-[11px] text-amber-900 dark:text-amber-200/90 leading-relaxed">
                  I hereby declare that all information submitted is true, correct, and verified. I grant permission to the Sangguniang Kabataan ng Barangay Bagbaguin to process my personal details solely for verification, scholarship evaluation, and Katipunan ng Kabataan profiling.
                </p>
                <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dataPrivacyConsent}
                    onChange={(e) => setDataPrivacyConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#0F2C59] rounded border-slate-300 focus:ring-[#0F2C59]"
                  />
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">
                    I understand and agree to the Data Privacy Terms and Official Council Guidelines. *
                  </span>
                </label>
              </div>
              {errors.dataPrivacyConsent && (
                <p className="text-xs text-rose-600 font-medium">{errors.dataPrivacyConsent}</p>
              )}
              {errors.submit && (
                <p role="alert" className="text-xs text-rose-600 font-medium">{errors.submit}</p>
              )}

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#F5A623] hover:bg-[#D98E16] disabled:opacity-60 text-[#081830] px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Submitting...' : 'Submit Official Application'}</span>
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isPrintingService ? 'Printing Request Submitted!' : 'Application Submitted Successfully!'}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  {isPrintingService
                    ? 'Your printing request has been logged into the Sangguniang Kabataan ng Bagbaguin Registry.'
                    : 'Your application has been logged into the Sangguniang Kabataan ng Bagbaguin Registry.'}
                </p>
              </div>

              {/* Reference Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 max-w-md mx-auto text-left space-y-2">
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Official Application Reference Code
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 font-mono text-base font-bold text-[#0F2C59] dark:text-amber-400">
                  <span>{submittedRef}</span>
                  <button
                    onClick={handleCopyRef}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors text-xs flex items-center gap-1 font-sans cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1">
                  <div><strong>Applicant:</strong> {applicantName}</div>
                  {isPrintingService ? (
                    <>
                      <div><strong>Requested date:</strong> {requestedDate}</div>
                      <div><strong>Date needed:</strong> {dateNeeded}</div>
                      <div><strong>Copies:</strong> {copiesNeeded}</div>
                    </>
                  ) : (
                    <div><strong>Sitio:</strong> {sitio}</div>
                  )}
                  <div><strong>Service:</strong> {serviceType}</div>
                  {isPrintingService && <div><strong>Preferred notification:</strong> {notificationPreference}</div>}
                  {isPrintingService && messengerName.trim() && <div><strong>Messenger name:</strong> {messengerName}</div>}
                  {isPrintingService && messengerProfileUrl.trim() && <div><strong>Facebook profile:</strong> {messengerProfileUrl}</div>}
                  <div><strong>Initial Status:</strong> <span className="text-amber-600 dark:text-amber-400 font-semibold">Under Evaluation</span></div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {isPrintingService
                  ? <>The SK Council will manually notify you through <strong className="text-slate-700 dark:text-slate-200">{notificationPreference}</strong>. Save your reference code and mobile number to track this request online from the <strong className="text-slate-700 dark:text-slate-200">Track Request</strong> page. You may also present the code at the SK Council Secretariat.</>
                  : <>An SMS verification has been queued for <strong className="font-mono text-slate-800 dark:text-slate-200">{contactNumber}</strong>. You may also track this reference code directly with the SK Council Secretariat at the Barangay Hall.</>}
              </p>

              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </button>
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Close & Return to Portal
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      <ConfirmationModal
        isOpen={isSubmitConfirmOpen}
        title={isSubmitting
          ? isPrintingService ? 'Submitting your printing request' : 'Submitting your application'
          : isPrintingService ? 'Confirm printing request' : 'Confirm application submission'}
        message={isSubmitting
          ? 'Uploading your documents and securely saving your application. Please keep this window open.'
          : isPrintingService
            ? `Submit your printing request for ${copiesNeeded} copies, requested on ${requestedDate}, needed by ${dateNeeded}?`
            : `Submit your application for ${serviceType}${uploadedFiles.length ? ` with ${uploadedFiles.length} attached document${uploadedFiles.length === 1 ? '' : 's'}` : ''}?`}
        confirmLabel={isPrintingService ? 'Submit Printing Request' : 'Submit Application'}
        isLoading={isSubmitting}
        onConfirm={submitApplication}
        onCancel={() => setIsSubmitConfirmOpen(false)}
      />
    </div>
  );
};
