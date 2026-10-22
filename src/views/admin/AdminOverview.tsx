import React from 'react';
import { 
  Program, 
  EventItem, 
  Announcement, 
  YouthApplication, 
  AdminSection 
} from '../../types/index.ts';
import { 
  Bell, 
  Calendar, 
  FolderKanban, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Plus, 
  ArrowUpRight,
  UserCheck
} from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';
import { aggregateAdminMetrics } from '../../utils/portalLogic.ts';

interface AdminOverviewProps {
  programs: Program[];
  events: EventItem[];
  announcements: Announcement[];
  applications: YouthApplication[];
  onNavigateSection: (section: AdminSection) => void;
  onOpenNewAnnouncement: () => void;
  onOpenNewEvent: () => void;
  onSelectApplication: (app: YouthApplication) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  programs,
  events,
  announcements,
  applications,
  onNavigateSection,
  onOpenNewAnnouncement,
  onOpenNewEvent,
  onSelectApplication,
}) => {
  const metrics = aggregateAdminMetrics(announcements, programs, events, applications);

  // Category distribution for applications
  const categoryCounts = applications.reduce((acc, app) => {
    let key = 'Education';
    if (app.serviceType.includes('Profiling')) key = 'Profiling';
    else if (app.serviceType.includes('Facility')) key = 'Facility';
    else if (app.serviceType.includes('Concern')) key = 'Concerns';
    else if (app.serviceType.includes('Endorsement')) key = 'Endorse';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const maxCount = Math.max(...Object.values(categoryCounts), 1);

  return (
    <div className="space-y-8">
      
      {/* Top Welcome & Quick Actions Strip */}
      <Reveal className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Executive Control Center · Sangguniang Kabataan
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            Barangay Bagbaguin Youth Governance System
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage portal records and resident submissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenNewAnnouncement}
            className="bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Post Announcement</span>
          </button>
          <button
            onClick={onOpenNewEvent}
            className="bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
          <button
            onClick={() => onNavigateSection('transparency')}
            className="border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <span>Upload Report</span>
          </button>
        </div>
      </Reveal>

      {/* 4 Primary Metric Cards */}
      <Reveal as="div" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: Announcements */}
        <div 
          onClick={() => onNavigateSection('announcements')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#0F2C59] dark:hover:border-amber-400/50 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Announcements
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {metrics.totalAnnouncements}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <span>● Published & Active</span>
            </span>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <Bell className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Programs */}
        <div 
          onClick={() => onNavigateSection('programs')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#0F2C59] dark:hover:border-amber-400/50 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Programs
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {metrics.activePrograms}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Across 8 Bagbaguin Sitios
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Upcoming Events */}
        <div 
          onClick={() => onNavigateSection('events')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#0F2C59] dark:hover:border-amber-400/50 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Upcoming Events
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {metrics.upcomingEvents}
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              Registration Open
            </span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pending Applications */}
        <div 
          onClick={() => onNavigateSection('applications')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-[#0F2C59] dark:hover:border-amber-400/50 transition-all cursor-pointer flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Applications
            </span>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {metrics.pendingApplications} Review
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Scholarships & Profiling
            </span>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl text-rose-600 dark:text-rose-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </Reveal>

      {/* Interactive Data Visualizations */}
      <Reveal as="div" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Youth Services by Category */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Youth Service Submissions by Category
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of online portal requests</p>
            </div>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">Total: {applications.length}</span>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span>{cat} Assistance</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{count} submissions</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-[#0F2C59] dark:bg-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Event Attendance Statistics */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Event Attendance & Capacity Fill Rates
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time attendee capacity tracker</p>
            </div>
            <button
              onClick={() => onNavigateSection('events')}
              className="text-xs font-semibold text-[#0F2C59] dark:text-amber-400 hover:underline cursor-pointer"
            >
              Manage Events →
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {events.slice(0, 4).map((evt) => {
              const pct = Math.min(100, Math.round((evt.registeredCount / evt.capacity) * 100));
              return (
                <div key={evt.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300">
                    <span className="truncate max-w-[240px]">{evt.title}</span>
                    <span className="font-mono text-slate-900 dark:text-white font-bold shrink-0">
                      {evt.registeredCount} / {evt.capacity} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 90 ? 'bg-amber-500' : 'bg-emerald-600 dark:bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </Reveal>

      {/* Recent Submissions Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Recent Youth Submissions & Assistance Queue
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live feed of resident applications awaiting council action</p>
          </div>
          <button
            onClick={() => onNavigateSection('applications')}
            className="text-xs font-bold text-[#0F2C59] dark:text-amber-400 hover:underline cursor-pointer"
          >
            View All Applications →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Ref Number</th>
                <th className="py-3 px-4">Applicant Name</th>
                <th className="py-3 px-4">Sitio</th>
                <th className="py-3 px-4">Service Requested</th>
                <th className="py-3 px-4">Date Submitted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 px-4 text-center text-slate-500 dark:text-slate-400">No applications have been submitted yet.</td>
                </tr>
              ) : applications.slice(0, 6).map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#0F2C59] dark:text-amber-400">{app.refNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">{app.applicantName}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{app.sitio}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{app.serviceType}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">{app.submittedAt}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
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
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectApplication(app)}
                      className="text-xs font-bold text-[#0F2C59] dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
