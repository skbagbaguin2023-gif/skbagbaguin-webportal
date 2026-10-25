import React, { useState } from 'react';
import { EventItem } from '../../types/index.ts';
import { X, CheckCircle2, Calendar, MapPin, Clock, QrCode } from 'lucide-react';

interface EventRegistrationModalProps {
  event: EventItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmRegistration: (eventId: string, details: {
    fullName: string;
    age: number;
    sitio: string;
    contactNumber: string;
    email: string;
    emergencyContact: string;
    registrationCode: string;
  }) => Promise<void>;
}

export const EventRegistrationModal: React.FC<EventRegistrationModalProps> = ({
  event,
  isOpen,
  onClose,
  onConfirmRegistration,
}) => {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [sitio, setSitio] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketCode, setTicketCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !event) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !contactNumber.trim()) {
      setError('Please provide your complete name and active mobile number.');
      return;
    }

    const generatedCode = `SKB-EVT-${Math.floor(1000 + Math.random() * 9000)}`;
    setIsSubmitting(true);
    setError('');
    try {
      await onConfirmRegistration(event.id, {
        fullName,
        age: Number(age),
        sitio,
        contactNumber,
        email,
        emergencyContact,
        registrationCode: generatedCode,
      });
      setTicketCode(generatedCode);
      setIsSuccess(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0F2C59] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              SK Bagbaguin Event Pass
            </span>
            <h2 className="text-base font-bold truncate max-w-xs sm:max-w-sm">
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Event Quick Info */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#0F2C59] dark:text-amber-400" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#0F2C59] dark:text-amber-400" />
            <span>{event.time}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#0F2C59] dark:text-amber-400 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        <div className="p-6">
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {error && (
                <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Participant Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Christian Paul D. Reyes"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Age (15-30) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="30"
                    required
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Resident Sitio *
                  </label>
                  <input
                    type="text"
                    value={sitio}
                    onChange={(e) => setSitio(e.target.value)}
                    placeholder="Enter your sitio"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Contact Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="09171234567"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Emergency Contact (Name & Phone) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Reyes (Mother) - 09181234567"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#F5A623] hover:bg-[#D98E16] disabled:opacity-60 text-[#081830] font-bold px-5 py-2 rounded-lg text-xs sm:text-sm shadow-md cursor-pointer"
                >
                  {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Registration Confirmed!</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Your seat has been reserved. Please present this e-pass upon venue entrance.
                </p>
              </div>

              {/* QR Code Pass Card */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 max-w-xs mx-auto text-center space-y-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 inline-block shadow-xs">
                  <QrCode className="w-28 h-28 mx-auto text-[#0F2C59] dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Ticket Pass Code
                  </div>
                  <div className="font-mono text-base font-extrabold text-[#0F2C59] dark:text-amber-400 mt-0.5">
                    {ticketCode}
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700 pt-2 space-y-0.5">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{fullName}</p>
                  <p>{sitio} · {event.title}</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white px-6 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
