import React from 'react';
import { 
  Program, 
  EventItem, 
  Announcement, 
  FacebookPost,
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
  facebookPosts: FacebookPost[];
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
  facebookPosts,
  council,
  services,
}) => {
  const featuredPrograms = programs.slice(0, 3);
  const upcomingEvents = events.slice(0, 3);
  const councilPreview = council.slice(0, 4);
  const availableServices = services.filter((service) => service.isActive);
  const serviceCardTheme = {
    card: 'border-[#0F2C59] bg-gradient-to-br from-[#173B72] to-[#081830] text-white',
    badge: 'border-amber-300/40 bg-amber-400/15 text-amber-300',
    number: 'text-amber-300/75',
    kicker: 'text-amber-300',
    title: 'text-white',
    description: 'text-slate-200',
    button: 'bg-[#F5A623] text-[#081830] hover:bg-[#FFC04D] focus-visible:outline-[#F5A623]',
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. HERO SECTION */}
      <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center overflow-hidden border-b border-navy-800 bg-[#0F2C59] py-12 text-white sm:py-16 md:min-h-[calc(100svh-6.25rem)] lg:py-20">
        {/* Background Image Scrim */}
        <div className="absolute inset-0 z-0">
          <HeroCarousel />
          <div className="absolute inset-0 bg-gradient-to-r from-[#081830]/75 via-[#0F2C59]/55 to-[#0F2C59]/15" />
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

      <Announcements announcements={announcements} facebookPosts={facebookPosts} />

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

        {availableServices.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 sm:gap-5">
            {availableServices.map((service, index) => {
              const Icon = service.name.toLowerCase().includes('print') ? Printer
                : service.name.toLowerCase().includes('profil') ? UserCheck : FileText;
              const theme = serviceCardTheme;
              const serviceDescription = service.description || service.tagline || 'Explore this service and submit your request online.';

              return (
                <article
                  key={service.id}
                  className={`group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg sm:min-h-72 sm:p-6 ${theme.card}`}
                >
                  <Icon
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-3 top-5 h-28 w-28 rotate-[-12deg] opacity-[0.12] transition-transform duration-300 group-hover:rotate-0 group-hover:scale-105 sm:h-36 sm:w-36"
                  />
                  <div className="relative flex items-start justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl border ${theme.badge}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className={`pt-1 text-[11px] font-bold tracking-[0.18em] ${theme.number}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="relative mt-5 flex-1">
                    <p className={`line-clamp-1 text-[11px] font-semibold ${theme.kicker}`}>
                      {service.tagline || 'Available Youth Service'}
                    </p>
                    <h3 className={`mt-2 text-xl font-extrabold leading-tight sm:text-2xl ${theme.title}`}>
                      {service.name}
                    </h3>
                    <p className={`mt-2 line-clamp-2 text-sm leading-relaxed ${theme.description}`}>
                      {serviceDescription}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenApplyModal(service.name)}
                    className={`relative mt-5 flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${theme.button}`}
                  >
                    <span className="truncate">Apply for {service.name}</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </button>
                </article>
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

      {/* 8. COMMUNITY PHOTO CAROUSEL */}
      <Reveal as="section" className="w-full">
        <div className="w-screen bg-white">
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Community Moments
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              SK BAGBAGUIN IN ACTION
            </h2>
            <span className="mt-2 block h-1 w-9 rounded-full bg-amber-400" />
            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
              Moments from our programs, projects, and communities.
            </p>
          </div>
          <div className="relative isolate h-[19rem] overflow-hidden sm:h-[25rem]">
            <HeroCarousel variant="marquee" />
          </div>
        </div>
      </Reveal>

    </div>
  );
};
