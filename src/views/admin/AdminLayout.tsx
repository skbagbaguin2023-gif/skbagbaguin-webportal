import React, { useState } from 'react';
import { 
  AdminSection, 
  Program, 
  EventItem, 
  Announcement, 
  YouthApplication, 
  TransparencyDoc, 
  CouncilMember, 
  FeedbackSuggestion,
  EventRegistration,
  ApplicationStatus
} from '../../types/index.ts';
import { 
  LayoutDashboard, 
  Bell, 
  FolderKanban, 
  Calendar, 
  Users, 
  FileText, 
  MessageSquare, 
  UserCheck, 
  LogOut, 
  Plus, 
  Search, 
  ShieldCheck, 
  Menu, 
  X, 
  ChevronDown,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AdminOverview } from './AdminOverview.tsx';
import { AnnouncementsManager } from './AnnouncementsManager.tsx';
import { ProgramsManager } from './ProgramsManager.tsx';
import { EventsManager } from './EventsManager.tsx';
import { ApplicationsManager } from './ApplicationsManager.tsx';
import { TransparencyManager } from './TransparencyManager.tsx';
import { FeedbackInbox } from './FeedbackInbox.tsx';
import { CouncilManager } from './CouncilManager.tsx';
import { ThemeToggle } from '../../components/ThemeToggle.tsx';

interface AdminLayoutProps {
  onReturnToPublic: () => void;
  programs: Program[];
  events: EventItem[];
  announcements: Announcement[];
  applications: YouthApplication[];
  transparencyDocs: TransparencyDoc[];
  council: CouncilMember[];
  feedbacks: FeedbackSuggestion[];
  registrations: EventRegistration[];
  onAddAnnouncement: (ann: Announcement) => void;
  onUpdateAnnouncement: (ann: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  onAddProgram: (prog: Program) => void;
  onUpdateProgram: (prog: Program) => void;
  onDeleteProgram: (id: string) => void;
  onAddEvent: (evt: EventItem) => void;
  onUpdateEvent: (evt: EventItem) => void;
  onDeleteEvent: (id: string) => void;
  onUpdateRegistrationStatus: (regId: string, status: 'Confirmed' | 'Waitlisted' | 'Checked-In') => void;
  onUpdateApplicationStatus: (id: string, status: ApplicationStatus, notes?: string) => void;
  onAddTransparencyDoc: (doc: TransparencyDoc) => void;
  onUpdateTransparencyDoc: (doc: TransparencyDoc) => void;
  onDeleteTransparencyDoc: (id: string) => void;
  onAddCouncilMember: (member: CouncilMember) => void;
  onUpdateCouncilMember: (member: CouncilMember) => void;
  onDeleteCouncilMember: (id: string) => void;
  onReorderCouncil: (council: CouncilMember[]) => void;
  onReplyFeedback: (id: string, reply: string, status: 'In Progress' | 'Resolved') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  onReturnToPublic,
  programs,
  events,
  announcements,
  applications,
  transparencyDocs,
  council,
  feedbacks,
  registrations,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onUpdateRegistrationStatus,
  onUpdateApplicationStatus,
  onAddTransparencyDoc,
  onUpdateTransparencyDoc,
  onDeleteTransparencyDoc,
  onAddCouncilMember,
  onUpdateCouncilMember,
  onDeleteCouncilMember,
  onReorderCouncil,
  onReplyFeedback,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectedAppForReview, setSelectedAppForReview] = useState<YouthApplication | null>(null);

  // Quick modals triggers
  const [triggerNewAnn, setTriggerNewAnn] = useState(false);
  const [triggerNewEvt, setTriggerNewEvt] = useState(false);

  const pendingCount = applications.filter((a) => a.status === 'Pending' || a.status === 'Under Review').length;
  const newFeedbackCount = feedbacks.filter((f) => f.status === 'New').length;

  const navItems: { id: AdminSection; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'announcements', label: 'Announcements CMS', icon: <Bell className="w-4 h-4" /> },
    { id: 'programs', label: 'Programs & Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'events', label: 'Events & Attendees', icon: <Calendar className="w-4 h-4" /> },
    { 
      id: 'applications', 
      label: 'Youth Applications', 
      icon: <Users className="w-4 h-4" />,
      badge: pendingCount > 0 ? pendingCount : undefined 
    },
    { id: 'transparency', label: 'Transparency Docs', icon: <FileText className="w-4 h-4" /> },
    { 
      id: 'feedback', 
      label: 'Feedback Inbox', 
      icon: <MessageSquare className="w-4 h-4" />,
      badge: newFeedbackCount > 0 ? newFeedbackCount : undefined 
    },
    { id: 'council', label: 'Council Profile', icon: <UserCheck className="w-4 h-4" /> },
  ];

  const handleReviewAppFromDashboard = (app: YouthApplication) => {
    setSelectedAppForReview(app);
    setActiveSection('applications');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#071324] flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100">
      
      {/* SIDEBAR NAVIGATION (Desktop: 260px fixed width, Mobile: slideout) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#081830] text-slate-300 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Top Brand Header */}
        <div>
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 flex items-center justify-center shrink-0">
                <div className="w-full h-full rounded-full bg-[#0F2C59] flex items-center justify-center font-bold text-amber-400 text-xs">
                  SKB
                </div>
              </div>
              <div>
                <h1 className="font-bold text-sm text-white tracking-tight leading-tight">
                  SK Bagbaguin
                </h1>
                <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider block">
                  Admin System
                </span>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Management Modules
            </div>

            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#0F2C59] text-amber-400 border border-amber-400/30 shadow-xs'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile & Return to Public */}
        <div className="p-4 border-t border-white/10 space-y-3 bg-[#061224]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-400/30 shrink-0">
              A
            </div>
            <div className="truncate text-xs">
              <span className="font-bold text-white block truncate">Portal Administrator</span>
              <span className="text-[11px] text-slate-400 block truncate">Administrator</span>
            </div>
          </div>

          <button
            onClick={onReturnToPublic}
            className="w-full py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5 text-amber-400" />
            <span>Return to Public Portal</span>
          </button>
        </div>

      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between gap-4 shadow-2xs">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="text-slate-400 dark:text-slate-500">SK Portal</span>
              <span className="mx-1.5 text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-900 dark:text-white font-bold capitalize">
                {activeSection.replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            
            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium">Valenzuela Youth Database Active</span>
            </div>

            {/* Quick Add Dropdown */}
            <div className="relative">
              <button
                onClick={() => setQuickAddOpen(!quickAddOpen)}
                className="bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Create New</span>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {quickAddOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-40 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in duration-150">
                  <button
                    onClick={() => {
                      setActiveSection('announcements');
                      setTriggerNewAnn(true);
                      setQuickAddOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>New Announcement</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('events');
                      setTriggerNewEvt(true);
                      setQuickAddOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Schedule Event</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('programs');
                      setQuickAddOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <FolderKanban className="w-3.5 h-3.5 text-blue-500" />
                    <span>Add Project</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSection('transparency');
                      setQuickAddOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-500" />
                    <span>Upload Report</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                aria-label="Admin notifications"
              >
                <Bell className="w-4 h-4" />
                {(pendingCount > 0 || newFeedbackCount > 0) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-40 text-xs space-y-2 animate-in fade-in duration-150">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span>Admin Notifications</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{pendingCount + newFeedbackCount} Pending</span>
                  </div>
                  <div className="space-y-1.5">
                    {pendingCount > 0 && (
                      <button
                        onClick={() => {
                          setActiveSection('applications');
                          setNotificationsOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-950 dark:text-amber-200 space-y-0.5 cursor-pointer block"
                      >
                        <strong className="block text-[11px]">{pendingCount} Youth Applications Pending</strong>
                        <span className="text-[10px] text-amber-800 dark:text-amber-300">Requires verification and committee sign-off</span>
                      </button>
                    )}
                    {newFeedbackCount > 0 && (
                      <button
                        onClick={() => {
                          setActiveSection('feedback');
                          setNotificationsOpen(false);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-950 dark:text-blue-200 space-y-0.5 cursor-pointer block"
                      >
                        <strong className="block text-[11px]">{newFeedbackCount} New Citizen Suggestions</strong>
                        <span className="text-[10px] text-blue-800 dark:text-blue-300">Awaiting official council response</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Global Theme Toggle */}
            <ThemeToggle variant="admin" />

            {/* Public portal quick button */}
            <button
              onClick={onReturnToPublic}
              className="text-xs font-semibold text-[#0F2C59] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Public Site</span>
            </button>

          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {activeSection === 'dashboard' && (
            <AdminOverview
              programs={programs}
              events={events}
              announcements={announcements}
              applications={applications}
              onNavigateSection={(sec) => setActiveSection(sec)}
              onOpenNewAnnouncement={() => {
                setActiveSection('announcements');
                setTriggerNewAnn(true);
              }}
              onOpenNewEvent={() => {
                setActiveSection('events');
                setTriggerNewEvt(true);
              }}
              onSelectApplication={handleReviewAppFromDashboard}
            />
          )}

          {activeSection === 'announcements' && (
            <AnnouncementsManager
              announcements={announcements}
              onAddAnnouncement={onAddAnnouncement}
              onUpdateAnnouncement={onUpdateAnnouncement}
              onDeleteAnnouncement={onDeleteAnnouncement}
              isCreateOpenInitially={triggerNewAnn}
              onCloseCreateModal={() => setTriggerNewAnn(false)}
            />
          )}

          {activeSection === 'programs' && (
            <ProgramsManager
              programs={programs}
              onAddProgram={onAddProgram}
              onUpdateProgram={onUpdateProgram}
              onDeleteProgram={onDeleteProgram}
            />
          )}

          {activeSection === 'events' && (
            <EventsManager
              events={events}
              registrations={registrations}
              onAddEvent={onAddEvent}
              onUpdateEvent={onUpdateEvent}
              onDeleteEvent={onDeleteEvent}
              onUpdateRegistrationStatus={onUpdateRegistrationStatus}
              isCreateOpenInitially={triggerNewEvt}
              onCloseCreateModal={() => setTriggerNewEvt(false)}
            />
          )}

          {activeSection === 'applications' && (
            <ApplicationsManager
              applications={applications}
              onUpdateStatus={onUpdateApplicationStatus}
              selectedApplicationId={selectedAppForReview?.id}
            />
          )}

          {activeSection === 'transparency' && (
            <TransparencyManager
              documents={transparencyDocs}
              onAddDoc={onAddTransparencyDoc}
              onUpdateDoc={onUpdateTransparencyDoc}
              onDeleteDoc={onDeleteTransparencyDoc}
            />
          )}

          {activeSection === 'feedback' && (
            <FeedbackInbox
              feedbacks={feedbacks}
              onReplyFeedback={onReplyFeedback}
            />
          )}

          {activeSection === 'council' && (
            <CouncilManager
              council={council}
              onAddCouncilMember={onAddCouncilMember}
              onUpdateCouncilMember={onUpdateCouncilMember}
              onDeleteCouncilMember={onDeleteCouncilMember}
              onReorderCouncil={onReorderCouncil}
            />
          )}
        </main>

      </div>
    </div>
  );
};
