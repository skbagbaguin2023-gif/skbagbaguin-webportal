import React, { useState } from 'react';
import { FeedbackSuggestion } from '../../types/index.ts';
import { 
  MapPin,
  Mail, 
  Phone, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Navigation,
  Building,
  AlertTriangle
} from 'lucide-react';

interface ContactViewProps {
  onSubmitFeedback: (item: FeedbackSuggestion) => void;
}

export const ContactView: React.FC<ContactViewProps> = ({ onSubmitFeedback }) => {
  const [senderName, setSenderName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [sitio, setSitio] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [category, setCategory] = useState<FeedbackSuggestion['category']>('General Suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please provide a subject and message.');
      return;
    }
    if (!consent) {
      setError('Consent is required under the Data Privacy Act.');
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newFeedback: FeedbackSuggestion = {
      id: `fb-${Date.now()}`,
      senderName: isAnonymous ? 'Anonymous' : senderName,
      email: isAnonymous ? '' : email,
      contact: isAnonymous ? undefined : contact,
      sitio,
      isAnonymous,
      category,
      subject,
      message,
      priority: category === 'Peace & Order' ? 'High' : 'Medium',
      status: 'New',
      submittedAt: formattedDate,
    };

    onSubmitFeedback(newFeedback);
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Banner */}
      <div className="bg-[#0F2C59] text-white rounded-2xl p-6 sm:p-10 border border-navy-800 shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-white/10 px-3 py-1 rounded-full">
            <Phone className="w-3.5 h-3.5" />
            <span>Citizen Assistance & SK Action Desk</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Contact the SK Council & Youth Feedback Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-200">
            Reach out directly to Sangguniang Kabataan officers, submit community concerns, report facility issues, or visit our youth desk at the Barangay Hall.
          </p>
        </div>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Address Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Barangay Hall Desk</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Official office address has not been added yet.
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            <span>Office hours have not been added yet.</span>
          </div>
        </div>

        {/* Emergency Hotlines */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Emergency & Hotlines</h3>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
            <li>Official emergency contact details have not been added yet.</li>
          </ul>
        </div>

        {/* Email & Digital Inquiries */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Online Correspondence</h3>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p>Official email and social media links have not been added yet.</p>
          </div>
        </div>

      </div>

      {/* Two Column: Interactive Map Representation & Feedback Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Interactive Map Visual */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Location Directory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Official location details</p>
            </div>
            <span className="text-xs font-semibold text-[#0F2C59] dark:text-amber-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
              Not added
            </span>
          </div>

          <div className="min-h-56 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Location information has not been added yet.
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            Geographic scope information has not been added yet.
          </div>
        </div>

        {/* Public Feedback & Concern Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <div className="mb-5">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Submit a Youth Suggestion or Concern
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your message will be directly reviewed by the SK Committee on Secretariat and Governance.
            </p>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {error && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-medium">
                  {error}
                </div>
              )}

              {/* Anonymous Checkbox */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="font-medium text-slate-700 dark:text-slate-200">Submit anonymously?</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-[#0F2C59] rounded"
                  />
                  <span className="text-slate-600 dark:text-slate-400 font-semibold">Yes, hide my identity</span>
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Juan Dela Cruz"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="juan@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Sitio of Concern
                  </label>
                  <input
                    type="text"
                    value={sitio}
                    onChange={(e) => setSitio(e.target.value)}
                    placeholder="Enter a sitio (optional)"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FeedbackSuggestion['category'])}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white"
                  >
                    <option value="General Suggestion">General Youth Suggestion</option>
                    <option value="Infrastructure & Facilities">Infrastructure & Sports Court</option>
                    <option value="Scholarship Queries">Scholarship & Assistance Inquiries</option>
                    <option value="Peace & Order">Peace, Order & Curfew</option>
                    <option value="Sports & Tournaments">Sports & Tournament Schedules</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Brief summary of your inquiry or feedback"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Message / Details *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Elaborate on your suggestion, request, or concerns..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/60">
                <label className="flex items-start gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#0F2C59] rounded"
                  />
                  <span className="text-[11px] text-amber-950 dark:text-amber-200 font-medium">
                    I agree to the Philippine Data Privacy Act of 2012 policy for processing this citizen feedback.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0F2C59] hover:bg-navy-800 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Send className="w-4 h-4 text-amber-400" />
                <span>Submit Citizen Message</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">Feedback Logged Successfully!</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                Salamat! Your message has been routed to the SK Council Secretariat. Action updates will be published or emailed within 48 hours.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setSubject('');
                  setMessage('');
                }}
                className="mt-3 text-xs font-semibold text-[#0F2C59] dark:text-amber-400 hover:underline cursor-pointer"
              >
                Submit another inquiry
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
