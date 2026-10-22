import React from 'react';
import { 
  Program, 
  EventItem, 
  Announcement, 
  PublicPage, 
  CouncilMember,
  ServiceType 
} from '../../types/index.ts';
import { 
  GraduationCap, 
  UserPlus, 
  Trophy, 
  HeartHandshake, 
  MessageSquare, 
  FileCheck2, 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ShieldCheck, 
  Download,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { calculateEventCapacity } from '../../utils/portalLogic.ts';

interface HomeViewProps {
  onNavigate: (page: PublicPage) => void;
  onOpenApplyModal: (service?: ServiceType) => void;
  onSelectProgram: (prog: Program) => void;
  onSelectEvent: (evt: EventItem) => void;
  programs: Program[];
  events: EventItem[];
  announcements: Announcement[];
  council: CouncilMember[];
}

const getInitials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenApplyModal,
  onSelectProgram,
  onSelectEvent,
  programs,
  events,
  announcements,
  council,
}) => {
  const featuredAnnouncements = announcements.slice(0, 3);
  const featuredPrograms = programs.slice(0, 3);
  const upcomingEvents = events.slice(0, 3);
  const councilPreview = council.slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-[#0F2C59] text-white overflow-hidden py-14 sm:py-20 lg:py-24 border-b border-navy-800">
        {/* Background Image Scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/homeImg1.jpg"
            alt="SK Bagbaguin Youth Assembly"
            className="w-full h-full object-cover opacity-20 filter saturate-120"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081830] via-[#0F2C59]/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            
            {/* Tagline kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sangguniang Kabataan ng Barangay Bagbaguin · Valenzuela City</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white text-balance">
              Empowering the Youth of <span className="text-[#F5A623]">Bagbaguin</span>, Valenzuela City
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
              Your central digital platform for educational assistance, youth development programs, community sports leagues, public transparency, and civic engagement.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('programs')}
                className="bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] font-bold text-sm sm:text-base px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Our Programs</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('events')}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 font-semibold text-sm sm:text-base px-5 py-3 rounded-lg transition-colors cursor-pointer"
              >
                View Upcoming Events
              </button>
            </div>

            {/* Trust markers */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-xs text-slate-300">
              <div>
                <span className="block font-bold text-white text-base">{programs.length}</span>
                <span>Programs Listed</span>
              </div>
              <div>
                <span className="block font-bold text-white text-base">{events.length}</span>
                <span>Events Listed</span>
              </div>
              <div>
                <span className="block font-bold text-white text-base">{announcements.length}</span>
                <span>Public Notices</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. QUICK ACCESS SERVICES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Quick Access Youth Services
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            Direct online application and booking portals for Bagbaguin youth residents (Ages 15-30)
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          
          {/* Service 1 */}
          <button
            onClick={() => onOpenApplyModal('Educational Assistance')}
            className="group p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#0F2C59] dark:group-hover:text-amber-300 transition-colors leading-tight">
                Educational Assistance
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Cash grant for students</p>
            </div>
          </button>

          {/* Service 2 */}
          <button
            onClick={() => onOpenApplyModal('Youth Profiling & Katipunan ng Kabataan Registration')}
            className="group p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/50 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 transition-colors">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#0F2C59] dark:group-hover:text-amber-300 transition-colors leading-tight">
                KK Youth Profiling
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Census & Registration</p>
            </div>
          </button>

          {/* Service 3 */}
          <button
            onClick={() => onNavigate('events')}
            className="group p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 transition-colors">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#0F2C59] dark:group-hover:text-amber-300 transition-colors leading-tight">
                Event Registration
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Sports & Workshops</p>
            </div>
          </button>

          {/* Service 4 */}
          <button
            onClick={() => onOpenApplyModal('Youth Profiling & Katipunan ng Kabataan Registration')}
            className="group p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 transition-colors">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#0F2C59] dark:group-hover:text-amber-300 transition-colors leading-tight">
                Volunteer Network
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Creek clean-up & drives</p>
            </div>
          </button>

          {/* Service 5 */}
          <button
            onClick={() => onNavigate('contact')}
            className="group p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3 transition-colors">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#0F2C59] dark:group-hover:text-amber-300 transition-colors leading-tight">
                Youth Concerns Box
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Anonymous suggestions</p>
            </div>
          </button>

          {/* Service 6 */}
          <button
            onClick={() => onOpenApplyModal('SK Barangay Endorsement')}
            className="group p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 transition-colors">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#0F2C59] dark:group-hover:text-amber-300 transition-colors leading-tight">
                SK Endorsement
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Youth recommendations</p>
            </div>
          </button>

        </div>
      </section>

      {/* 3. FEATURED ANNOUNCEMENTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Official Announcements & Advisories
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest official notices from the Sangguniang Kabataan Council</p>
          </div>
          <button
            onClick={() => onNavigate('announcements')}
            className="text-xs font-semibold text-[#0F2C59] dark:text-amber-400 hover:text-navy-800 dark:hover:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>View All Notices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredAnnouncements.length === 0 ? (
            <p className="md:col-span-3 text-sm text-slate-500 dark:text-slate-400">No announcements have been added yet.</p>
          ) : featuredAnnouncements.map((ann) => (
            <div
              key={ann.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{ann.category}</span>
                  <span className="font-mono text-[11px]">{ann.date}</span>
                </div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {ann.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                  {ann.excerpt}
                </p>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[170px]">{ann.author}</span>
                <button
                  onClick={() => onNavigate('announcements')}
                  className="text-xs font-bold text-[#0F2C59] dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Read Advisory →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PROGRAMS & PROJECTS */}
      <section className="bg-slate-100/70 dark:bg-slate-900/40 py-12 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Pillars of Youth Development
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Current initiatives approved under the Annual Barangay Youth Investment Program</p>
            </div>
            <button
              onClick={() => onNavigate('programs')}
              className="text-xs font-semibold text-[#0F2C59] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Explore All Programs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredPrograms.length === 0 ? (
              <p className="md:col-span-3 text-sm text-slate-500 dark:text-slate-400">No programs have been added yet.</p>
            ) : featuredPrograms.map((prog) => (
              <div
                key={prog.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative h-44 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={prog.imageUrl}
                    alt={prog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-[#0F2C59] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs">
                    {prog.category}
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-xs">
                    {prog.status}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {prog.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {prog.summary}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                      <span>Implementation Progress</span>
                      <strong className="font-mono text-slate-900 dark:text-white">{prog.progressPercent}%</strong>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0F2C59] dark:bg-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${prog.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                      {prog.targetBeneficiaries}
                    </span>
                    <button
                      onClick={() => onSelectProgram(prog)}
                      className="text-xs font-bold text-[#0F2C59] dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. UPCOMING EVENTS PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Upcoming Youth Events & Activities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Join community tournaments, civic seminars, and volunteer drives</p>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-semibold text-[#0F2C59] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Full Event Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingEvents.length === 0 ? (
            <p className="md:col-span-3 text-sm text-slate-500 dark:text-slate-400">No events have been added yet.</p>
          ) : upcomingEvents.map((evt) => {
            const cap = calculateEventCapacity(evt.capacity, evt.registeredCount);
            const dateParts = evt.date.split('-');
            const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const month = monthNames[parseInt(dateParts[1], 10) - 1] || 'OCT';
            const day = dateParts[2] || '28';

            return (
              <div
                key={evt.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Date badge + title */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="bg-[#0F2C59] dark:bg-slate-800 text-white rounded-lg p-2 text-center w-12 shrink-0 shadow-xs border border-transparent dark:border-slate-700">
                      <span className="block text-[10px] font-bold text-amber-400">{month}</span>
                      <span className="block text-base font-extrabold leading-tight">{day}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider">
                        {evt.category}
                      </span>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {evt.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
                    {evt.summary}
                  </p>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    <strong className="text-slate-900 dark:text-white">{evt.registeredCount}/{evt.capacity}</strong> Seats Filled
                  </span>
                  <button
                    onClick={() => onSelectEvent(evt)}
                    className="bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] font-bold text-xs px-3.5 py-1.5 rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    Register Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. COUNCIL ACHIEVEMENTS & IMPACT METRICS */}
      <section className="bg-[#081830] dark:bg-[#061224] text-white py-14 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Current Portal Activity
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mt-1">
              Published Information
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Counts reflect records currently added to the portal.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <span className="block text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {programs.length}
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Programs</h3>
              <p className="text-xs text-slate-400 mt-1">Added to the portal</p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <span className="block text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {events.length}
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Events</h3>
              <p className="text-xs text-slate-400 mt-1">Added to the portal</p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <span className="block text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {announcements.length}
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Announcements</h3>
              <p className="text-xs text-slate-400 mt-1">Added to the portal</p>
            </div>

            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
              <span className="block text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                {council.length}
              </span>
              <h3 className="text-sm font-bold text-white mt-2">Council Members</h3>
              <p className="text-xs text-slate-400 mt-1">Added to the directory</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. MEET YOUR SK COUNCIL PREVIEW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Meet Your SK Council
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Council directory</p>
          </div>
          <button
            onClick={() => onNavigate('about')}
            className="text-xs font-semibold text-[#0F2C59] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Complete Council Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {councilPreview.length === 0 ? (
            <p className="sm:col-span-2 lg:col-span-4 text-sm text-slate-500 dark:text-slate-400">Council members have not been added yet.</p>
          ) : councilPreview.map((cm) => (
            <div
              key={cm.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow text-center p-5"
            >
              <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-slate-200 dark:bg-slate-800 mb-3 border-2 border-amber-400 shadow-xs">
                {cm.imageUrl ? (
                  <img src={cm.imageUrl} alt={cm.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0F2C59] text-amber-400 font-bold">{getInitials(cm.name)}</div>
                )}
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{cm.name}</h3>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">{cm.position}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{cm.committee}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
                {cm.motto}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. TRANSPARENCY & ACCOUNTABILITY BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#0F2C59] to-[#173B72] rounded-2xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-400/20 text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Full Public Disclosure Policy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Open Governance & Public Financial Reports
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Access the official Comprehensive Barangay Youth Development Plan (CBYDP), Annual Investment Programs (AIP), Commission on Audit liquidation papers, and approved resolutions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('transparency')}
              className="bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] font-bold text-xs sm:text-sm px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>View Public Financial Reports</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
