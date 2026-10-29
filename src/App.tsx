/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { 
  PublicPage, 
  Program, 
  EventItem, 
  Announcement, FacebookPost,
  YouthApplication, 
  TransparencyDoc, 
  CouncilMember, 
  FeedbackSuggestion,
  EventRegistration,
  ServiceType,
  ApplicationStatus,
  YouthService,
  ProgramFiscalYear,
} from './types/index.ts';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { DEFAULT_COUNCIL_MEMBERS } from './data/councilMembers.ts';
import { DEFAULT_ANNOUNCEMENTS } from './data/defaultAnnouncements.ts';
import { Analytics } from '@vercel/analytics/react';
import { generateUuid } from './utils/uuid.ts';

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
const ChatAssistant = lazy(() => import('./components/ChatAssistant.tsx').then((module) => ({ default: module.ChatAssistant })));

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
import { isAdminUser, observeAuthState, supabaseConfigured } from './services/supabase.ts';
import {
  createPortalRecord,
  deleteApplicationDocument,
  deleteTransparencyDocument,
  deletePortalRecord,
  initializePortalDefaults,
  registerForEvent,
  savePortalRecord,
  saveCouncilOrder,
  sendFeedbackReplyEmail,
  subscribeToPortalCollection,
  uploadTransparencyDocument,
  type PortalCollection,
} from './services/supabaseData.ts';
import { ToastNotifications } from './components/ToastNotifications.tsx';
import type { ToastKind, ToastMessage } from './components/ToastNotifications.tsx';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PublicPage>('home');
  const [pathname, setPathname] = useState(window.location.pathname);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [backendError, setBackendError] = useState('');
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const notify = (kind: ToastKind, message: string) => {
    setToast({ id: Date.now(), kind, message });
  };

  useEffect(() => {
    const updatePathname = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePathname);
    return () => window.removeEventListener('popstate', updatePathname);
  }, []);

  useEffect(() => {
    return observeAuthState(setCurrentUser);
  }, []);

  // Core Data Collections
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programFiscalYears, setProgramFiscalYears] = useState<ProgramFiscalYear[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEFAULT_ANNOUNCEMENTS);
  const [facebookPosts, setFacebookPosts] = useState<FacebookPost[]>([]);
  const [applications, setApplications] = useState<YouthApplication[]>([]);
  const [transparencyDocs, setTransparencyDocs] = useState<TransparencyDoc[]>([]);
  const [council, setCouncil] = useState<CouncilMember[]>(DEFAULT_COUNCIL_MEMBERS);
  const [feedbacks, setFeedbacks] = useState<FeedbackSuggestion[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [services, setServices] = useState<YouthService[]>([]);

  useEffect(() => {
    if (!supabaseConfigured) {
      setBackendError('Supabase is not configured. Add the project URL and publishable key to .env.local.');
      return;
    }

    setBackendError('');
    const isAdmin = isAdminUser(currentUser);
    const reportListenerError = (error: Error) => {
      console.error('Supabase data subscription failed.', error);
      setBackendError('Unable to load portal data from Supabase. Check your project and database policies.');
    };
    let isActive = true;
    const subscriptions: (() => void)[] = [];
    const subscribe = () => {
      if (!isActive) return;
      subscriptions.push(
        subscribeToPortalCollection<Program>('programs', setPrograms, reportListenerError),
        subscribeToPortalCollection<ProgramFiscalYear>('programSettings', setProgramFiscalYears, reportListenerError),
        subscribeToPortalCollection<EventItem>('events', setEvents, reportListenerError),
        subscribeToPortalCollection<Announcement>(
          'announcements',
          (records) => setAnnouncements(
            records.length > 0 || isAdmin ? records : DEFAULT_ANNOUNCEMENTS
          ),
          reportListenerError
        ),
        subscribeToPortalCollection<FacebookPost>('facebookPosts', setFacebookPosts, reportListenerError),
        subscribeToPortalCollection<YouthApplication>('applications', setApplications, reportListenerError),
        subscribeToPortalCollection<TransparencyDoc>('transparencyDocs', setTransparencyDocs, reportListenerError),
        subscribeToPortalCollection<CouncilMember>(
          'council',
          (records) => setCouncil(
            records.length > 0 ? records : DEFAULT_COUNCIL_MEMBERS
          ),
          reportListenerError
        ),
        subscribeToPortalCollection<FeedbackSuggestion>('feedbacks', setFeedbacks, reportListenerError),
        subscribeToPortalCollection<EventRegistration>('registrations', setRegistrations, reportListenerError),
        subscribeToPortalCollection<YouthService>('services', setServices, reportListenerError),
      );
    };

    if (isAdmin) {
      void initializePortalDefaults(announcements, DEFAULT_COUNCIL_MEMBERS)
        .then(subscribe)
        .catch(reportListenerError);
    } else {
      subscribe();
    }

    return () => {
      isActive = false;
      subscriptions.forEach((unsubscribe) => unsubscribe());
    };
  }, [currentUser]);

  const reportWriteError = (error: unknown) => {
    console.error('Supabase data write failed.', error);
    const message = error instanceof Error ? error.message : 'Supabase could not save this change. Please try again.';
    setBackendError(
      error instanceof Error
        ? `Supabase could not save this change: ${error.message}`
        : 'Supabase could not save this change. Please try again.'
    );
    notify('error', message);
  };

  const saveRecord = <T extends { id: string }>(collection: PortalCollection, record: T) => {
    void savePortalRecord(collection, record)
      .then(() => notify('success', 'Changes saved successfully.'))
      .catch(reportWriteError);
  };

  const deleteRecord = (collection: PortalCollection, id: string) => {
    void deletePortalRecord(collection, id)
      .then(() => notify('success', 'Item deleted successfully.'))
      .catch(reportWriteError);
  };

  // Modal State Controls
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyDefaultService, setApplyDefaultService] = useState<ServiceType>('');

  const [selectedProgramModal, setSelectedProgramModal] = useState<Program | null>(null);
  const [selectedEventModal, setSelectedEventModal] = useState<EventItem | null>(null);
  const [selectedDocModal, setSelectedDocModal] = useState<TransparencyDoc | null>(null);

  // Handlers for Youth Submissions
  const handleOpenApplyModal = (service?: ServiceType) => {
    const activeServices = services.filter((item) => item.isActive);
    setApplyDefaultService(
      activeServices.find((item) => item.name === service)?.name
      ?? activeServices[0]?.name
      ?? ''
    );
    setIsApplyModalOpen(true);
  };

  const handleSubmitApplication = async (newApp: YouthApplication) => {
    await createPortalRecord('applications', newApp);
    notify('success', 'Your application was submitted successfully.');
  };

  const handleConfirmEventRegistration = async (
    eventId: string,
    details: {
      fullName: string;
      age: number;
      sitio: string;
      contactNumber: string;
      email: string;
      emergencyContact: string;
      registrationCode: string;
    }
  ): Promise<void> => {
    const targetEvent = events.find((e) => e.id === eventId);
    const newReg: EventRegistration = {
      id: `reg-${generateUuid()}`,
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
      registrationCode: details.registrationCode,
    };

    await registerForEvent(eventId, newReg);
    notify('success', 'Your event registration was submitted successfully.');
  };

  const handleSubmitFeedback = async (item: FeedbackSuggestion) => {
    await createPortalRecord('feedbacks', item);
    notify('success', 'Your feedback was submitted successfully.');
  };

  const handleAddService = (service: YouthService) => {
    setServices((previous) => [service, ...previous]);
    saveRecord('services', service);
  };

  const handleUpdateService = (service: YouthService) => {
    setServices((previous) => previous.map((item) => item.id === service.id ? service : item));
    saveRecord('services', service);
  };

  const handleDeleteService = (id: string) => {
    setServices((previous) => previous.filter((item) => item.id !== id));
    deleteRecord('services', id);
  };

  // CMS Handlers
  const handleAddAnnouncement = async (ann: Announcement): Promise<void> => {
    try {
      await savePortalRecord('announcements', ann);
      setAnnouncements((prev) => [ann, ...prev]);
      notify('success', 'Announcement added successfully.');
    } catch (error) {
      reportWriteError(error);
      throw error;
    }
  };

  const handleUpdateAnnouncement = async (ann: Announcement): Promise<void> => {
    try {
      await savePortalRecord('announcements', ann);
      setAnnouncements((prev) => prev.map((a) => (a.id === ann.id ? ann : a)));
      notify('success', 'Announcement updated successfully.');
    } catch (error) {
      reportWriteError(error);
      throw error;
    }
  };

  const handleDeleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    deleteRecord('announcements', id);
  };

  const handleAddFacebookPost = async (post: FacebookPost): Promise<void> => {
    await savePortalRecord('facebookPosts', post);
    setFacebookPosts((previous) => [post, ...previous]);
    notify('success', 'Facebook post added successfully.');
  };

  const handleUpdateFacebookPost = async (post: FacebookPost): Promise<void> => {
    await savePortalRecord('facebookPosts', post);
    setFacebookPosts((previous) => previous.map((item) => item.id === post.id ? post : item));
    notify('success', 'Facebook post updated successfully.');
  };

  const handleDeleteFacebookPost = async (id: string): Promise<void> => {
    await deletePortalRecord('facebookPosts', id);
    setFacebookPosts((previous) => previous.filter((item) => item.id !== id));
    notify('success', 'Facebook post deleted successfully.');
  };

  const handleAddProgram = (prog: Program) => {
    setPrograms((prev) => [prog, ...prev]);
    saveRecord('programs', prog);
  };

  const handleSaveProgramFiscalYear = (settings: ProgramFiscalYear) => {
    setProgramFiscalYears((previous) => [
      ...previous
        .filter((item) => item.id !== settings.id && item.year !== settings.year)
        .map((item) => settings.isCurrent ? { ...item, isCurrent: false } : item),
      settings,
    ]);
    saveRecord('programSettings', settings);
  };

  const handleUpdateProgram = (prog: Program) => {
    setPrograms((prev) => prev.map((p) => (p.id === prog.id ? prog : p)));
    saveRecord('programs', prog);
  };

  const handleDeleteProgram = (id: string) => {
    setPrograms((prev) => prev.filter((p) => p.id !== id));
    deleteRecord('programs', id);
  };

  const handleAddEvent = (evt: EventItem) => {
    setEvents((prev) => [evt, ...prev]);
    saveRecord('events', evt);
  };

  const handleUpdateEvent = (evt: EventItem) => {
    setEvents((prev) => prev.map((e) => (e.id === evt.id ? evt : e)));
    saveRecord('events', evt);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    deleteRecord('events', id);
  };

  const handleAddCouncilMember = async (member: CouncilMember): Promise<void> => {
    const orderedMember = { ...member, sortOrder: -1 };
    try {
      await savePortalRecord('council', orderedMember);
      setCouncil((prev) => [orderedMember, ...prev]);
      notify('success', 'Council member added successfully.');
    } catch (error) {
      reportWriteError(error);
      throw error;
    }
  };

  const handleUpdateCouncilMember = async (member: CouncilMember): Promise<void> => {
    try {
      await savePortalRecord('council', member);
      setCouncil((prev) => prev.map((current) => current.id === member.id ? member : current));
      notify('success', 'Council member updated successfully.');
    } catch (error) {
      reportWriteError(error);
      throw error;
    }
  };

  const handleDeleteCouncilMember = (id: string) => {
    setCouncil((prev) => prev.filter((member) => member.id !== id));
    deleteRecord('council', id);
  };

  const handleReorderCouncil = async (orderedCouncil: CouncilMember[]): Promise<void> => {
    try {
      const savedCouncil = await saveCouncilOrder(orderedCouncil);
      setCouncil(savedCouncil);
      notify('success', 'Council member order saved successfully.');
    } catch (error) {
      reportWriteError(error);
      throw error;
    }
  };

  const handleUpdateRegistrationStatus = (regId: string, status: 'Confirmed' | 'Waitlisted' | 'Checked-In') => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, status } : r))
    );
    const registration = registrations.find((item) => item.id === regId);
    if (registration) saveRecord('registrations', { ...registration, status });
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
    const application = applications.find((item) => item.id === id);
    if (application) saveRecord('applications', {
      ...application,
      status,
      adminNotes: notes !== undefined ? notes : application.adminNotes,
    });
  };

  const handleDeleteApplication = async (id: string): Promise<void> => {
    const application = applications.find((item) => item.id === id);
    try {
      await deletePortalRecord('applications', id);
      setApplications((previous) => previous.filter((item) => item.id !== id));
      notify('success', 'Application deleted successfully.');
    } catch (error) {
      reportWriteError(error);
      throw error;
    }

    for (const document of application?.documentsAttached ?? []) {
      if (!document.storagePath) continue;
      try {
        await deleteApplicationDocument(document.storagePath);
      } catch (error) {
        reportWriteError(error);
      }
    }
  };

  const handleAddTransparencyDoc = async (doc: TransparencyDoc, file: File): Promise<void> => {
    const storagePath = await uploadTransparencyDocument(file, doc.id);
    const savedDoc = { ...doc, storagePath };
    try {
      await savePortalRecord('transparencyDocs', savedDoc);
      setTransparencyDocs((prev) => [savedDoc, ...prev]);
    } catch (error) {
      try {
        await deleteTransparencyDocument(storagePath);
      } catch (cleanupError) {
        console.error('Unable to remove an unlinked transparency PDF.', cleanupError);
      }
      reportWriteError(error);
      throw error;
    }
  };

  const handleUpdateTransparencyDoc = (doc: TransparencyDoc) => {
    setTransparencyDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
    saveRecord('transparencyDocs', doc);
  };

  const handleDeleteTransparencyDoc = async (id: string) => {
    const document = transparencyDocs.find((item) => item.id === id);
    try {
      await deletePortalRecord('transparencyDocs', id);
      setTransparencyDocs((prev) => prev.filter((item) => item.id !== id));
      if (document?.storagePath) {
        try {
          await deleteTransparencyDocument(document.storagePath);
        } catch (error) {
          reportWriteError(error);
        }
      }
    } catch (error) {
      reportWriteError(error);
      throw error;
    }
  };

  const handleDeleteFeedback = async (id: string): Promise<void> => {
    try {
      await deletePortalRecord('feedbacks', id);
      setFeedbacks((previous) => previous.filter((item) => item.id !== id));
    } catch (error) {
      reportWriteError(error);
      throw error;
    }
  };

  const handleReplyFeedback = async (
    id: string,
    reply: string,
    status: 'In Progress' | 'Resolved'
  ): Promise<{ emailSent: boolean; message?: string }> => {
    const feedback = feedbacks.find((item) => item.id === id);
    if (!feedback) throw new Error('This feedback message is no longer available. Refresh the inbox and try again.');

    const updatedFeedback = { ...feedback, adminReply: reply, status };
    await savePortalRecord('feedbacks', updatedFeedback);
    setFeedbacks((previous) => previous.map((item) => item.id === id ? updatedFeedback : item));

    if (!feedback.email.trim()) {
      return {
        emailSent: false,
        message: 'Reply saved, but this anonymous message has no email address to send to.',
      };
    }

    try {
      await sendFeedbackReplyEmail(id, reply);
      return { emailSent: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Reply saved, but its email could not be sent.';
      setBackendError(message);
      throw error;
    }
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
        <>
          <ToastNotifications toast={toast} onDismiss={() => setToast(null)} />
          {backendError && (
            <div role="alert" className="fixed inset-x-0 top-0 z-[100] bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-sm text-amber-950">
              {backendError}
            </div>
          )}
          <ProtectedRoute>
            <AdminLayout
            onReturnToPublic={async () => {
              await logout();
              window.history.replaceState({}, '', '/');
              setPathname('/');
              setCurrentPage('home');
              setBackendError('');
            }}
            programs={programs}
            programFiscalYears={programFiscalYears}
            events={events}
            announcements={announcements}
            facebookPosts={facebookPosts}
            applications={applications}
            transparencyDocs={transparencyDocs}
            council={council}
            feedbacks={feedbacks}
            registrations={registrations}
            services={services}
            onAddAnnouncement={handleAddAnnouncement}
            onUpdateAnnouncement={handleUpdateAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            onAddFacebookPost={handleAddFacebookPost}
            onUpdateFacebookPost={handleUpdateFacebookPost}
            onDeleteFacebookPost={handleDeleteFacebookPost}
            onAddProgram={handleAddProgram}
            onUpdateProgram={handleUpdateProgram}
            onDeleteProgram={handleDeleteProgram}
            onSaveProgramFiscalYear={handleSaveProgramFiscalYear}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onUpdateRegistrationStatus={handleUpdateRegistrationStatus}
            onUpdateApplicationStatus={handleUpdateApplicationStatus}
            onDeleteApplication={handleDeleteApplication}
            onAddTransparencyDoc={handleAddTransparencyDoc}
            onUpdateTransparencyDoc={handleUpdateTransparencyDoc}
            onDeleteTransparencyDoc={handleDeleteTransparencyDoc}
            onAddCouncilMember={handleAddCouncilMember}
            onUpdateCouncilMember={handleUpdateCouncilMember}
            onDeleteCouncilMember={handleDeleteCouncilMember}
            onReorderCouncil={handleReorderCouncil}
            onReplyFeedback={handleReplyFeedback}
            onDeleteFeedback={handleDeleteFeedback}
            onAddService={handleAddService}
            onUpdateService={handleUpdateService}
            onDeleteService={handleDeleteService}
            />
          </ProtectedRoute>
        </>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen overflow-x-clip flex flex-col bg-slate-50 text-slate-800 dark:bg-[#071324] dark:text-slate-100 transition-colors duration-200">
        <ToastNotifications toast={toast} onDismiss={() => setToast(null)} />
        {backendError && (
          <div role="status" className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-center text-sm text-amber-950">
            {backendError}
          </div>
        )}
        <>
          <Header
            currentPage={currentPage}
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0 });
            }}
            onOpenApplyModal={() => handleOpenApplyModal()}
          />

          <main className="flex-1 pb-20">
            <div key={currentPage} className="page-transition">
              {currentPage === 'home' && (
              <HomeView
                onNavigate={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0 });
                }}
                onOpenApplyModal={handleOpenApplyModal}
                onSelectProgram={(prog) => setSelectedProgramModal(prog)}
                onSelectEvent={(evt) => setSelectedEventModal(evt)}
                programs={programs}
                events={events}
                announcements={announcements}
                facebookPosts={facebookPosts}
                council={council}
                services={services.filter((service) => service.isActive)}
              />
              )}

              {currentPage === 'about' && (
              <AboutView
                council={council}
                transparencyDocs={transparencyDocs}
                onPreviewDoc={(doc) => setSelectedDocModal(doc)}
              />
              )}

              {currentPage === 'programs' && (
              <ProgramsView
                programs={programs}
                fiscalYears={programFiscalYears}
                onSelectProgram={(prog) => setSelectedProgramModal(prog)}
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
              <YouthServicesView services={services} onOpenApplyModal={handleOpenApplyModal} />
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
            </div>
          </main>

          <Footer
            onNavigate={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0 });
            }}
          />
          {!currentUser && (
            <Suspense fallback={null}>
              <ChatAssistant onNavigate={(page) => { setCurrentPage(page); window.scrollTo({ top: 0 }); }} />
            </Suspense>
          )}
        </>

      {/* Global Modals for Public Portal */}
      <ApplicationModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        defaultService={applyDefaultService}
        services={services}
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
      />

      <DocumentPreviewModal
        isOpen={!!selectedDocModal}
        doc={selectedDocModal}
        onClose={() => setSelectedDocModal(null)}
      />

      </div>
      <Analytics />
    </ThemeProvider>
  );
}
