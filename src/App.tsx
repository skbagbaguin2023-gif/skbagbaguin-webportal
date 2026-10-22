/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  UserRole, 
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

// Public Components & Views
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { RoleSwitcher } from './components/RoleSwitcher.tsx';
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
import { AdminLayout } from './views/admin/AdminLayout.tsx';

export default function App() {
  const [role, setRole] = useState<UserRole>('resident');
  const [currentPage, setCurrentPage] = useState<PublicPage>('home');

  // Core Data Collections
  const [programs, setPrograms] = useState<Program[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [applications, setApplications] = useState<YouthApplication[]>([]);
  const [transparencyDocs, setTransparencyDocs] = useState<TransparencyDoc[]>([]);
  const [council, setCouncil] = useState<CouncilMember[]>(DEFAULT_COUNCIL_MEMBERS);
  const [feedbacks, setFeedbacks] = useState<FeedbackSuggestion[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);

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

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-[#071324] dark:text-slate-100 transition-colors duration-200">
        
        {/* Floating Demo Role Switcher (Resident vs SK Admin) */}
        <RoleSwitcher
          currentRole={role}
          onRoleChange={(newRole) => {
            setRole(newRole);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

      {role === 'resident' ? (
        /* PART 1: PUBLIC YOUTH PORTAL */
        <>
          <Header
            currentPage={currentPage}
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenApplyModal={() => handleOpenApplyModal()}
            onSwitchToAdmin={() => setRole('admin')}
            role={role}
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
            onSwitchToAdmin={() => setRole('admin')}
          />
        </>
      ) : (
        /* PART 2: AUTHORIZED SK ADMIN DASHBOARD */
        <AdminLayout
          onReturnToPublic={() => setRole('resident')}
          programs={programs}
          events={events}
          announcements={announcements}
          applications={applications}
          transparencyDocs={transparencyDocs}
          council={council}
          onAddCouncilMember={handleAddCouncilMember}
          onUpdateCouncilMember={handleUpdateCouncilMember}
          onDeleteCouncilMember={handleDeleteCouncilMember}
          onReorderCouncil={handleReorderCouncil}
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
          onReplyFeedback={handleReplyFeedback}
        />
      )}

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
