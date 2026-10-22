import React, { useState } from 'react';
import { EventItem, EventCategory } from '../../types/index.ts';
import { filterEvents, calculateEventCapacity } from '../../utils/portalLogic.ts';
import { 
  Calendar as CalendarIcon, 
  List, 
  MapPin, 
  Clock, 
  Users, 
  Search, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';

interface EventsViewProps {
  events: EventItem[];
  onSelectEvent: (evt: EventItem) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ events, onSelectEvent }) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | EventCategory>('All');
  const [selectedMonth, setSelectedMonth] = useState('All');

  const filteredEvents = filterEvents(events, searchQuery, selectedCategory, selectedMonth);

  const categories: ('All' | EventCategory)[] = ['All', 'Sports', 'Leadership', 'Community', 'Health', 'Arts & Culture'];
  const months = [
    { id: 'All', label: 'All Dates' },
    { id: '2026-10', label: 'October 2026' },
    { id: '2026-11', label: 'November 2026' },
    { id: '2026-12', label: 'December 2026' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Banner */}
      <Reveal className="bg-[#0F2C59] text-white rounded-2xl p-6 sm:p-10 border border-navy-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-white/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Community Gatherings & Sports Tournaments</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Upcoming Youth Events & Activities
          </h1>
          <p className="text-xs sm:text-sm text-slate-200">
            Sign up for free barangay tournaments, leadership seminars, environmental volunteer drives, and mental health circles.
          </p>
        </div>

        {/* View Toggle */}
        <div className="bg-white/10 p-1 rounded-xl flex items-center gap-1 border border-white/20 shrink-0">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#F5A623] text-slate-950 font-bold'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-[#F5A623] text-slate-950 font-bold'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Calendar View</span>
          </button>
        </div>
      </Reveal>

      {/* Filter Row */}
      <Reveal className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by event title, venue, or activity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
            >
              {months.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0F2C59] text-white shadow-xs dark:bg-amber-500 dark:text-slate-950'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Reveal>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredEvents.map((evt, index) => {
            const cap = calculateEventCapacity(evt.capacity, evt.registeredCount);
            const dateParts = evt.date.split('-');
            const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const month = monthNames[parseInt(dateParts[1], 10) - 1] || 'OCT';
            const day = dateParts[2] || '28';

            return (
              <Reveal
                key={evt.id}
                delay={index * 100}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  {/* Date Badge */}
                  <div className="bg-[#0F2C59] dark:bg-slate-800 text-white rounded-xl p-2.5 text-center w-16 shrink-0 shadow-xs border border-transparent dark:border-slate-700">
                    <span className="block text-[11px] font-bold text-amber-400">{month}</span>
                    <span className="block text-2xl font-black leading-tight">{day}</span>
                    <span className="block text-[10px] text-slate-300 dark:text-slate-400 mt-0.5">{dateParts[0]}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{evt.category}</span>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        cap.isFull ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {cap.isFull ? 'Registration Full' : evt.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-snug">
                      {evt.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                      {evt.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{evt.time}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{evt.venue}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>Ages: {evt.targetAge}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Capacity & CTA */}
                <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span className="font-mono text-sm">{evt.registeredCount}</span> / {evt.capacity} Registered
                    </div>
                    <div className="w-28 bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${cap.isFull ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${cap.percentFilled}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectEvent(evt)}
                    disabled={cap.isFull}
                    className={`px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      cap.isFull
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                        : 'bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] hover:shadow-md'
                    }`}
                  >
                    {cap.isFull ? 'Seats Full' : 'Register Now'}
                  </button>
                </div>
                </Reveal>
            );
          })}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">October – December 2026 Activity Schedule</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Interactive schedule of all Sangguniang Kabataan events</p>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Showing {filteredEvents.length} scheduled sessions</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((evt, index) => (
              <Reveal
                key={evt.id}
                delay={index * 100}
                onClick={() => onSelectEvent(evt)}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#0F2C59] dark:hover:border-amber-400 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 shadow-2xs hover:shadow-sm transition-all cursor-pointer space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#0F2C59] dark:text-amber-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {evt.date}
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">{evt.category}</span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                  {evt.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{evt.venue}</p>
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500">{evt.time}</span>
                  <span className="text-[#0F2C59] dark:text-amber-400 font-bold">Register →</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
