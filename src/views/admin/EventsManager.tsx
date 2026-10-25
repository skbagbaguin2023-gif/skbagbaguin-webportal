import React, { useState } from 'react';
import { EventItem, EventCategory, EventStatus, EventRegistration } from '../../types/index.ts';
import { calculateEventCapacity } from '../../utils/portalLogic.ts';
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Download, 
  CheckCircle, 
  Clock, 
  MapPin, 
  X, 
  Trash2,
  Edit,
  UserCheck
} from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal.tsx';

interface EventsManagerProps {
  events: EventItem[];
  registrations: EventRegistration[];
  onAddEvent: (evt: EventItem) => void;
  onUpdateEvent: (evt: EventItem) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateRegistrationStatus: (regId: string, status: 'Confirmed' | 'Waitlisted' | 'Checked-In') => void;
  isCreateOpenInitially?: boolean;
  onCloseCreateModal?: () => void;
}

export const EventsManager: React.FC<EventsManagerProps> = ({
  events,
  registrations,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onUpdateRegistrationStatus,
  isCreateOpenInitially = false,
  onCloseCreateModal,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(isCreateOpenInitially);
  const [activeEventRoster, setActiveEventRoster] = useState<EventItem | null>(null);
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);

  // New Event form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<EventCategory>('Sports');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formCapacity, setFormCapacity] = useState<number | ''>('');
  const [formTargetAge, setFormTargetAge] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const categories: EventCategory[] = ['Sports', 'Leadership', 'Community', 'Health', 'Arts & Culture'];

  const filteredEvents = events.filter(
    (e) => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase())
  );

  const rosterForActiveEvent = activeEventRoster
    ? registrations.filter((r) => r.eventId === activeEventRoster.id)
    : [];

  const handleOpenCreate = () => {
    setFormTitle('');
    setFormCategory('Sports');
    setFormDate('');
    setFormTime('');
    setFormVenue('');
    setFormCapacity('');
    setFormTargetAge('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvt: EventItem = {
      id: `evt-${Date.now()}`,
      title: formTitle,
      summary: formDescription.slice(0, 120),
      category: formCategory,
      date: formDate,
      time: formTime,
      venue: formVenue,
      capacity: Number(formCapacity),
      registeredCount: 0,
      status: 'Registration Open',
      targetAge: formTargetAge,
      registrationDeadline: formDate,
      description: formDescription,
    };
    onAddEvent(newEvt);
    setIsModalOpen(false);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const handleExportCSV = (evtTitle: string) => {
    const rows = [
      ['Registration Code', 'Full Name', 'Age', 'Sitio', 'Mobile', 'Email', 'Status', 'Timestamp'],
      ...rosterForActiveEvent.map((r) => [
        r.registrationCode,
        r.fullName,
        String(r.age),
        r.sitio,
        r.contactNumber,
        r.email,
        r.status,
        r.registeredAt,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${evtTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Events & Participant Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Plan youth seminars, tournaments, check-in attendees, and export rosters</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Create New Event</span>
        </button>
      </Reveal>

      {/* Events Table */}
      <Reveal className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-72 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search event schedules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{filteredEvents.length} Events Listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Event Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Venue</th>
                <th className="py-3 px-4">Capacity Status</th>
                <th className="py-3 px-4 text-right">Roster & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEvents.map((evt) => {
                const cap = calculateEventCapacity(evt.capacity, evt.registeredCount);
                return (
                  <tr key={evt.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">{evt.title}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate block">{evt.summary}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#0F2C59] dark:text-amber-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {evt.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                      <div>{evt.date}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-[11px] font-sans">{evt.time}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[180px]">{evt.venue}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {evt.registeredCount} / {evt.capacity}
                        </div>
                        <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${cap.isFull ? 'bg-rose-500' : 'bg-emerald-500 dark:bg-emerald-400'}`}
                            style={{ width: `${cap.percentFilled}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveEventRoster(evt)}
                          className="bg-slate-100 dark:bg-slate-800 hover:bg-[#0F2C59] dark:hover:bg-amber-500 hover:text-white dark:hover:text-slate-950 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>Roster</span>
                        </button>
                        <button
                          onClick={() => setEventToDelete(evt)}
                          className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* Roster & Participant Modal */}
      {activeEventRoster && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-xs sm:items-center">
          <div className="my-0 flex max-h-[calc(100dvh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:my-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex shrink-0 items-center justify-between bg-[#0F2C59] px-6 py-4 text-white">
              <div>
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                  Attendee Roster & Check-In
                </span>
                <h3 className="font-bold text-base truncate max-w-lg">{activeEventRoster.title}</h3>
              </div>
              <button onClick={() => setActiveEventRoster(null)} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto p-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Total Registered: </span>
                  <strong className="text-slate-900 dark:text-white font-mono text-sm">{activeEventRoster.registeredCount} attendees</strong>
                </div>
                <button
                  onClick={() => handleExportCSV(activeEventRoster.title)}
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Export Attendee List (.CSV)</span>
                </button>
              </div>

              {/* Roster Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Pass Code</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3">Sitio</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Check-In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {rosterForActiveEvent.length > 0 ? (
                      rosterForActiveEvent.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0F2C59] dark:text-amber-400">{reg.registrationCode}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{reg.fullName}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{reg.sitio}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">{reg.contactNumber}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              reg.status === 'Checked-In' 
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                            }`}>
                              {reg.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => onUpdateRegistrationStatus(reg.id, reg.status === 'Checked-In' ? 'Confirmed' : 'Checked-In')}
                              className="text-[11px] font-bold text-[#0F2C59] dark:text-amber-400 hover:underline cursor-pointer"
                            >
                              {reg.status === 'Checked-In' ? 'Undo Check-in' : 'Mark Present'}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                          No registrations found for this event yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveEventRoster(null)}
                  className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-xs sm:items-center">
          <div className="my-0 flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:my-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex shrink-0 items-center justify-between bg-[#0F2C59] px-6 py-4 text-white">
              <h3 className="font-bold text-base">Schedule New SK Event</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="min-h-0 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Inter-Sitio Volleyball Finals"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as EventCategory)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Seat / Attendee Capacity *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="2000"
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Time Span *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1:00 PM – 5:00 PM"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Venue / Location *
                </label>
                <input
                  type="text"
                  required
                  value={formVenue}
                  onChange={(e) => setFormVenue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Event Description & Registration Notes
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white font-bold px-5 py-2 rounded-lg text-xs cursor-pointer shadow-xs"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={eventToDelete !== null}
        title="Delete this event?"
        message={eventToDelete ? `Delete event "${eventToDelete.title}"?` : ''}
        confirmLabel="Delete Event"
        onConfirm={() => {
          if (eventToDelete) onDeleteEvent(eventToDelete.id);
          setEventToDelete(null);
        }}
        onCancel={() => setEventToDelete(null)}
      />
    </div>
  );
};
