import React from 'react';
import { 
  Program, 
  EventItem, 
  Announcement, 
  PublicPage, 
  CouncilMember,
  ServiceType,
  YouthService,
} from '../../types/index.ts';
import { 
  FileText,
  Printer,
  UserCheck,
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
import Reveal from '../../components/Reveal.jsx';
import HeroCarousel from '../../components/HeroCarousel.jsx';
import Announcements from '../../components/Announcements.jsx';
import LocationMap from '../../components/LocationMap.jsx';
import { CouncilMemberAvatar } from '../../components/CouncilMemberAvatar.tsx';
import { PortalImage } from '../../components/PortalImage.tsx';

interface HomeViewProps {
  onNavigate: (page: PublicPage) => void;
  onOpenApplyModal: (service?: ServiceType) => void;
  onSelectProgram: (prog: Program) => void;
  onSelectEvent: (evt: EventItem) => void;
  programs: Program[];
  events: EventItem[];
  announcements: Announcement[];
  council: CouncilMember[];
  services: YouthService[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenApplyModal,
  onSelectProgram,
  onSelectEvent,
  programs,
  events,
  announcements,
  council,
  services,
}) => {
  const featuredPrograms = programs.slice(0, 3);
  const upcomingEvents = events.slice(0, 3);
  const councilPreview = council.slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative bg-[#0F2C59] text-white overflow-hidden py-14 sm:py-20 lg:py-24 border-b border-navy-800">
        {/* Background Image Scrim */}
        <div className="absolute inset-0 z-0">
          <HeroCarousel />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081830] via-[#0F2C59]/90 to-transparent" />
        </div>

        <Reveal className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </Reveal>
      </section>

      <Announcements announcements={announcements} />

      {/* 2. QUICK ACCESS SERVICES GRID */}
      <Reveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Quick Access Youth Services
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            Direct online application and booking portals for Bagbaguin youth residents (Ages 15-30)
          </p>
        </div>

        {services.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {services.map((service) => {
              const Icon = service.name.toLowerCase().includes('print') ? Printer
                : service.name.toLowerCase().includes('profil') ? UserCheck : FileText;
              return (
                <button
                  key={service.id}
                  onClick={() => onOpenApplyModal(service.name)}
                  className="group p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 hover:border-amber-400 rounded-xl shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-[#0F2C59] dark:group-hover:text-amber-300 transition-colors leading-tight">
                      {service.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      {service.tagline || service.description || 'View service details'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            No services are currently available.
          </p>
        )}
      </Reveal>

      {/* 4. FEATURED PROGRAMS & PROJECTS */}
      <Reveal as="section" className="bg-slate-100/70 dark:bg-slate-900/40 py-12 border-y border-slate-200 dark:border-slate-800">
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
            ) : featuredPrograms.map((prog, index) => (
              <Reveal
                key={prog.id}
                delay={index * 100}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative h-44 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <PortalImage
                    src={prog.imageUrl}
                    alt={prog.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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
              </Reveal>
            ))}
          </div>
        </div>
      </Reveal>

      {/* 5. UPCOMING EVENTS PREVIEW */}
      <Reveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          ) : upcomingEvents.map((evt, index) => {
            const cap = calculateEventCapacity(evt.capacity, evt.registeredCount);
            const dateParts = evt.date.split('-');
            const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
            const month = monthNames[parseInt(dateParts[1], 10) - 1] || 'OCT';
            const day = dateParts[2] || '28';

            return (
              <Reveal
                key={evt.id}
                delay={index * 100}
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
              </Reveal>
            );
          })}
        </div>
      </Reveal>

      {/* 6. COUNCIL ACHIEVEMENTS & IMPACT METRICS */}
      <Reveal as="section" className="bg-[#081830] dark:bg-[#061224] text-white py-14 border-y border-white/5">
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
      </Reveal>

      {/* 7. MEET YOUR SK COUNCIL PREVIEW */}
      <Reveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          ) : councilPreview.map((cm, index) => (
            <Reveal
              key={cm.id}
              delay={index * 100}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow text-center p-5"
            >
              <div className="w-20 h-20 rounded-full mx-auto overflow-hidden bg-slate-200 dark:bg-slate-800 mb-3 border-2 border-amber-400 shadow-xs">
                <CouncilMemberAvatar member={cm} className="h-full w-full bg-[#0F2C59]" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{cm.name}</h3>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">{cm.position}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{cm.committee}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-3 border-t border-slate-100 dark:border-slate-800 pt-2">
                {cm.motto}
              </p>
            </Reveal>
          ))}
        </div>
      </Reveal>

      <LocationMap />

      {/* 8. TRANSPARENCY & ACCOUNTABILITY BANNER */}
      <Reveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </Reveal>

    </div>
  );
};
