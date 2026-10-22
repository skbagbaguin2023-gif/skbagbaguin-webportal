import React, { useState } from 'react';
import { ServiceType, YouthApplication } from '../../types/index.ts';
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
  Check
} from 'lucide-react';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: ServiceType;
  onSubmitApplication: (app: YouthApplication) => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  defaultService = 'Educational Assistance',
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
  const [email, setEmail] = useState('');
  const [schoolOrOrg, setSchoolOrOrg] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [details, setDetails] = useState('');
  const [dataPrivacyConsent, setDataPrivacyConsent] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

    const newRef = generateApplicationRef(serviceType, Math.floor(100 + Math.random() * 900));
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newApp: YouthApplication = {
      id: `app-${Date.now()}`,
      refNumber: newRef,
      applicantName,
      age: Number(age),
      birthday,
      gender,
      sitio,
      address: address || `${sitio}, Barangay Bagbaguin`,
      contactNumber,
      email,
      serviceType,
      schoolOrOrg: schoolOrOrg || 'Pamantasan ng Lungsod ng Valenzuela (PLV)',
      yearLevel: yearLevel || 'College Student',
      details: details || 'Official online grant application via SK Bagbaguin Youth Portal.',
      status: 'Pending',
      submittedAt: formattedDate,
      adminNotes: 'New online portal submission. Verification required.',
      documentsAttached: uploadedFiles.map((name) => ({
        name,
        size: '1.1 MB',
        status: 'Pending Review',
      })),
    };

    onSubmitApplication(newApp);
    setSubmittedRef(newRef);
    setStep(4);
  };

  const handleCopyRef = () => {
    if (submittedRef) {
      navigator.clipboard.writeText(submittedRef);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0F2C59] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              Barangay Bagbaguin Youth Assistance Portal
            </div>
            <h2 className="text-lg font-bold">Online Youth Application Wizard</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium">
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
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Youth Assistance Program / Service
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                >
                  <option value="Educational Assistance">Educational Assistance</option>
                  <option value="Youth Profiling & Katipunan ng Kabataan Registration">Youth Profiling & Katipunan ng Kabataan Registration</option>
                  <option value="SK Facility / Equipment Booking">SK Facility / Equipment Booking (Covered Court, Tents, Sound System)</option>
                  <option value="Youth Concern & Suggestion">Youth Concern / Suggestion Box</option>
                  <option value="SK Barangay Endorsement">Request Official SK Endorsement / Recommendation</option>
                </select>
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
                
                {/* Drag and drop simulation area */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Upload scanned PDF or JPG copies of requirements
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Accepted: COR, Valid School/Gov ID, Certificate of Indigency (Max 10MB)
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedFiles((prev) => [
                        ...prev,
                        `Doc_Indigency_Certificate_${Date.now().toString().slice(-4)}.pdf`,
                      ]);
                    }}
                    className="mt-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
                  >
                    <span>+ Attach Sample Document</span>
                  </button>
                </div>

                {/* File list */}
                <div className="mt-3 space-y-1.5">
                  {uploadedFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[280px]">{f}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px]">Ready</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-500 font-bold cursor-pointer"
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
                  className="bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Official Application</span>
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
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Application Submitted Successfully!</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Your application has been logged into the Sangguniang Kabataan ng Bagbaguin Registry.
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
                  <div><strong>Sitio:</strong> {sitio}</div>
                  <div><strong>Service:</strong> {serviceType}</div>
                  <div><strong>Initial Status:</strong> <span className="text-amber-600 dark:text-amber-400 font-semibold">Under Evaluation</span></div>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                An SMS verification has been queued for <strong className="font-mono text-slate-800 dark:text-slate-200">{contactNumber}</strong>. You may also track this reference code directly with the SK Council Secretariat at the Barangay Hall.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white px-6 py-2 rounded-lg text-sm font-semibold cursor-pointer"
                >
                  Close & Return to Portal
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
