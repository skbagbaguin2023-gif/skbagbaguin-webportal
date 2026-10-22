/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  PublicPage, 
  Program, 
  EventItem, 
  Announcement, 
  YouthApplication, 
  TransparencyDoc, 
  CouncilMember, 
  FeedbackSuggestion,
  EventRegistration,
  ServiceType,
  ApplicationStatus 
} from './types/index.ts';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { DEFAULT_COUNCIL_MEMBERS } from './data/councilMembers.ts';
import { DEFAULT_ANNOUNCEMENTS } from './data/defaultAnnouncements.ts';

// Public Components & Views
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { HomeView } from './views/public/HomeView.tsx';
import { AboutView } from './views/public/AboutView.tsx';
import { ProgramsView } from './views/public/ProgramsView.tsx';
import { EventsView } from './views/public/EventsView.tsx';
import { AnnouncementsView } from './views/public/AnnouncementsView.tsx';
import { YouthServicesView } from './views/public/YouthServicesView.tsx';
import { TransparencyView } from './views/public/TransparencyView.tsx';
import { ContactView } from './views/public/ContactView.tsx';

// Modals
import { ApplicationModal } from './components/modals/ApplicationModal.tsx';
import { EventRegistrationModal } from './components/modals/EventRegistrationModal.tsx';
import { ProgramDetailModal } from './components/modals/ProgramDetailModal.tsx';
import { DocumentPreviewModal } from './components/modals/DocumentPreviewModal.tsx';

// Admin System
import AdminLogin from './pages/AdminLogin.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AdminLayout } from './views/admin/AdminLayout.tsx';
import { logout } from './utils/auth.js';

const ANNOUNCEMENTS_STORAGE_KEY = 'sk_portal_announcements';
const ANNOUNCEMENTS_MIGRATION_KEY = 'sk_portal_announcements_kk_profiling_seed_version';
const KK_PROFILING_ANNOUNCEMENT_ID = 'kk-profiling-2024';
const KK_PROFILING_ANNOUNCEMENT_MIGRATION_VERSION = '2';

function isAnnouncement(value: unknown): value is Announcement {
  if (typeof value !== 'object' || value === null) return false;
  const announcement = value as Record<string, unknown>;
  const categories = ['General Notice', 'Scholarships', 'Sports Leagues', 'Public Safety', 'Youth Assemblies', 'Health'];

  return (
    typeof announcement.id === 'string' &&
    typeof announcement.title === 'string' &&
    typeof announcement.excerpt === 'string' &&
    typeof announcement.content === 'string' &&
    typeof announcement.category === 'string' &&
    categories.includes(announcement.category) &&
    typeof announcement.author === 'string' &&
    typeof announcement.date === 'string' &&
    (announcement.status === 'Published' || announcement.status === 'Draft') &&
    (announcement.isPinned === undefined || typeof announcement.isPinned === 'boolean') &&
    (announcement.coverImage === undefined || typeof announcement.coverImage === 'string') &&
    (announcement.sourcePostUrl === undefined || typeof announcement.sourcePostUrl === 'string')
  );
}

function loadAnnouncements(): Announcement[] {
  const saved = localStorage.getItem(ANNOUNCEMENTS_STORAGE_KEY);
  if (saved === null) return DEFAULT_ANNOUNCEMENTS;

  try {
    const parsed: unknown = JSON.parse(saved);
    if (Array.isArray(parsed) && parsed.every(isAnnouncement)) {
      let mergedAnnouncements = parsed.map((announcement) => {
        const defaultAnnouncement = DEFAULT_ANNOUNCEMENTS.find((item) => item.id === announcement.id);
        if (!announcement.sourcePostUrl?.trim() && defaultAnnouncement?.sourcePostUrl?.trim()) {
          return { ...announcement, sourcePostUrl: defaultAnnouncement.sourcePostUrl };
        }
        return announcement;
      });
      const kkProfilingAnnouncement = DEFAULT_ANNOUNCEMENTS.find(
        (announcement) => announcement.id === KK_PROFILING_ANNOUNCEMENT_ID
      );
      const savedKKAnnouncement = mergedAnnouncements.find((announcement) => announcement.id === KK_PROFILING_ANNOUNCEMENT_ID);
      if (
        localStorage.getItem(ANNOUNCEMENTS_MIGRATION_KEY) !== KK_PROFILING_ANNOUNCEMENT_MIGRATION_VERSION &&
        kkProfilingAnnouncement &&
        !savedKKAnnouncement
      ) {
        mergedAnnouncements = [...mergedAnnouncements, kkProfilingAnnouncement];
      }
      return mergedAnnouncements;
    }
    console.error('Saved announcements are invalid; loading the default announcement.');
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    console.error('Saved announcements could not be parsed; loading the default announcement.', error);
  }

  localStorage.removeItem(ANNOUNCEMENTS_STORAGE_KEY);
  return DEFAULT_ANNOUNCEMENTS;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<PublicPage>('home');
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const updatePathname = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
  }, []);

  // Core Data Collections
  const [programs, setPrograms] = useState<Program[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(loadAnnouncements);
  const [applications, setApplications] = useState<YouthApplication[]>([]);
  const [transparencyDocs, setTransparencyDocs] = useState<TransparencyDoc[]>([]);
  const [council, setCouncil] = useState<CouncilMember[]>(DEFAULT_COUNCIL_MEMBERS);
  const [feedbacks, setFeedbacks] = useState<FeedbackSuggestion[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);

  useEffect(() => {
    localStorage.setItem(ANNOUNCEMENTS_STORAGE_KEY, JSON.stringify(announcements));
    if (announcements.some((announcement) => announcement.id === KK_PROFILING_ANNOUNCEMENT_ID)) {
      localStorage.setItem(ANNOUNCEMENTS_MIGRATION_KEY, KK_PROFILING_ANNOUNCEMENT_MIGRATION_VERSION);
    }
  }, [announcements]);

  // Modal State Controls
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyDefaultService, setApplyDefaultService] = useState<ServiceType>('Educational Assistance');

  const [selectedProgramModal, setSelectedProgramModal] = useState<Program | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<EventItem | null>(null);
  const [selectedDocModal, setSelectedDocModal] = useState<TransparencyDoc | null>(null);

  // Handlers for Youth Submissions
  const handleOpenApplyModal = (service?: ServiceType | string) => {
    if (service) {
      if (service.includes('Educational')) setApplyDefaultService('Educational Assistance');
      else if (service.includes('Profiling') || service.includes('KK')) setApplyDefaultService('Youth Profiling & Katipunan ng Kabataan Registration');
      else if (service.includes('Facility') || service.includes('Booking')) setApplyDefaultService('SK Facility / Equipment Booking');
      else if (service.includes('Concern')) setApplyDefaultService('Youth Concern & Suggestion');
      else if (service.includes('Endorsement')) setApplyDefaultService('SK Barangay Endorsement');
      else setApplyDefaultService('Educational Assistance');
    } else {
      setApplyDefaultService('Educational Assistance');
    }
    setIsApplyModalOpen(true);
  };

  const handleSubmitApplication = (newApp: YouthApplication) => {
    setApplications((prev) => [newApp, ...prev]);
  };

  const handleConfirmEventRegistration = (
    eventId: string,
    details: {
      fullName: string;
      age: number;
      sitio: string;
      contactNumber: string;
      email: string;
      emergencyContact: string;
    }
  ) => {
    const targetEvent = events.find((e) => e.id === eventId);
    const newReg: EventRegistration = {
      id: `reg-${Date.now()}`,
      eventId,
      eventTitle: targetEvent?.title || 'SK Bagbaguin Event',
      fullName: details.fullName,
      age: details.age,
      sitio: details.sitio,
      contactNumber: details.contactNumber,
      email: details.email,
      emergencyContact: details.emergencyContact,
      registeredAt: new Date().toLocaleString(),
      status: 'Confirmed',
      registrationCode: `SKB-EVT-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setRegistrations((prev) => [newReg, ...prev]);

    // Increment attendee count on event
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId
          ? {
              ...evt,
              registeredCount: Math.min(evt.capacity, evt.registeredCount + 1),
            }
          : evt
      )
    );
  };

  const handleSubmitFeedback = (item: FeedbackSuggestion) => {
    setFeedbacks((prev) => [item, ...prev]);
  };

  // CMS Handlers
  const handleAddAnnouncement = (ann: Announcement) => {
    setAnnouncements((prev) => [ann, ...prev]);
  };

  const handleUpdateAnnouncement = (ann: Announcement) => {
    setAnnouncements((prev) => prev.map((a) => (a.id === ann.id ? ann : a)));
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddProgram = (prog: Program) => {
    setPrograms((prev) => [prog, ...prev]);
  };

  const handleUpdateProgram = (prog: Program) => {
    setPrograms((prev) => prev.map((p) => (p.id === prog.id ? prog : p)));
  };

  const handleDeleteProgram = (id: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddEvent = (evt: EventItem) => {
    setEvents((prev) => [evt, ...prev]);
  };

  const handleUpdateEvent = (evt: EventItem) => {
    setEvents((prev) => prev.map((e) => (e.id === evt.id ? evt : e)));
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAddCouncilMember = (member: CouncilMember) => {
    setCouncil((prev) => [member, ...prev]);
  };

  const handleUpdateCouncilMember = (member: CouncilMember) => {
    setCouncil((prev) => prev.map((current) => current.id === member.id ? member : current));
  };

  const handleDeleteCouncilMember = (id: string) => {
    setCouncil((prev) => prev.filter((member) => member.id !== id));
  };

  const handleReorderCouncil = (orderedCouncil: CouncilMember[]) => {
    setCouncil(orderedCouncil);
  };

  const handleUpdateRegistrationStatus = (regId: string, status: 'Confirmed' | 'Waitlisted' | 'Checked-In') => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, status } : r))
    );
  };

  const handleUpdateApplicationStatus = (id: string, status: ApplicationStatus, notes?: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              status,
              adminNotes: notes !== undefined ? notes : app.adminNotes,
            }
          : app
      )
    );
  };

  const handleAddTransparencyDoc = (doc: TransparencyDoc) => {
    setTransparencyDocs((prev) => [doc, ...prev]);
  };

  const handleUpdateTransparencyDoc = (doc: TransparencyDoc) => {
    setTransparencyDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
  };

  const handleDeleteTransparencyDoc = (id: string) => {
    setTransparencyDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const handleReplyFeedback = (id: string, reply: string, status: 'In Progress' | 'Resolved') => {
    setFeedbacks((prev) =>
      prev.map((f) => (f.id === id ? { ...f, adminReply: reply, status } : f))
    );
  };

  if (pathname === '/admin/login') {
    return (
      <ThemeProvider>
        <AdminLogin />
      </ThemeProvider>
    );
  }

  if (pathname === '/admin') {
    return (
      <ThemeProvider>
        <ProtectedRoute>
          <AdminLayout
            onReturnToPublic={() => {
              logout();
              window.location.assign('/');
            }}
            programs={programs}
            events={events}
            announcements={announcements}
            applications={applications}
            transparencyDocs={transparencyDocs}
            council={council}
            feedbacks={feedbacks}
            registrations={registrations}
            onAddAnnouncement={handleAddAnnouncement}
            onUpdateAnnouncement={handleUpdateAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onAddProgram={handleAddProgram}
            onUpdateProgram={handleUpdateProgram}
            onDeleteProgram={handleDeleteProgram}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onUpdateRegistrationStatus={handleUpdateRegistrationStatus}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onAddTransparencyDoc={handleAddTransparencyDoc}
            onUpdateTransparencyDoc={handleUpdateTransparencyDoc}
            onDeleteTransparencyDoc={handleDeleteTransparencyDoc}
            onAddCouncilMember={handleAddCouncilMember}
            onUpdateCouncilMember={handleUpdateCouncilMember}
            onDeleteCouncilMember={handleDeleteCouncilMember}
            onReorderCouncil={handleReorderCouncil}
            onReplyFeedback={handleReplyFeedback}
          />
        </ProtectedRoute>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen overflow-x-clip flex flex-col bg-slate-50 text-slate-800 dark:bg-[#071324] dark:text-slate-100 transition-colors duration-200">
        <>
          <Header
            currentPage={currentPage}
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenApplyModal={() => handleOpenApplyModal()}
          />

          <main className="flex-1 pb-20">
            {currentPage === 'home' && (
              <HomeView
                onNavigate={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenApplyModal={handleOpenApplyModal}
                onSelectProgram={(prog) => setSelectedProgramModal(prog)}
                onSelectEvent={(evt) => setSelectedEventModal(evt)}
                programs={programs}
                events={events}
                announcements={announcements}
                council={council}
              />
            )}

            {currentPage === 'about' && (
              <AboutView council={council} />
            )}

            {currentPage === 'programs' && (
              <ProgramsView
                programs={programs}
                onSelectProgram={(prog) => setSelectedProgramModal(prog)}
                onOpenApply={handleOpenApplyModal}
              />
            )}

            {currentPage === 'events' && (
              <EventsView
                events={events}
                onSelectEvent={(evt) => setSelectedEventModal(evt)}
              />
            )}

            {currentPage === 'announcements' && (
              <AnnouncementsView announcements={announcements} />
            )}

            {currentPage === 'services' && (
              <YouthServicesView onOpenApplyModal={handleOpenApplyModal} />
            )}

            {currentPage === 'transparency' && (
              <TransparencyView
                documents={transparencyDocs}
                onPreviewDoc={(doc) => setSelectedDocModal(doc)}
              />
            )}

            {currentPage === 'contact' && (
              <ContactView onSubmitFeedback={handleSubmitFeedback} />
            )}
          </main>

          <Footer
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </>

      {/* Global Modals for Public Portal */}
      <ApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        defaultService={applyDefaultService}
        onSubmitApplication={handleSubmitApplication}
      />

      <EventRegistrationModal
        isOpen={!!selectedEventModal}
        event={selectedEventModal}
        onClose={() => setSelectedEventModal(null)}
        onConfirmRegistration={handleConfirmEventRegistration}
      />

      <ProgramDetailModal
        isOpen={!!selectedProgramModal}
        program={selectedProgramModal}
        onClose={() => setSelectedProgramModal(null)}
        onApply={(title) => handleOpenApplyModal(title)}
      />

      <DocumentPreviewModal
        isOpen={!!selectedDocModal}
        doc={selectedDocModal}
        onClose={() => setSelectedDocModal(null)}
      />

      </div>
    </ThemeProvider>
  );
}
