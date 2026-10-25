import React, { useEffect, useState } from 'react';
import { FeedbackSuggestion } from '../../types/index.ts';
import { 
  Search, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Reply, 
  Send,
  User,
  ShieldCheck,
  Check,
  LoaderCircle,
  Trash2
} from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal.tsx';

interface FeedbackInboxProps {
  feedbacks: FeedbackSuggestion[];
  onReplyFeedback: (
    id: string,
    reply: string,
    newStatus: 'In Progress' | 'Resolved'
  ) => Promise<{ emailSent: boolean; message?: string }>;
  onDeleteFeedback: (id: string) => Promise<void>;
}

export const FeedbackInbox: React.FC<FeedbackInboxProps> = ({
  feedbacks,
  onReplyFeedback,
  onDeleteFeedback,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [activeFeedback, setActiveFeedback] = useState<FeedbackSuggestion | null>(feedbacks[0] ?? null);
  const [replyText, setReplyText] = useState(activeFeedback?.adminReply || '');
  const [sentToast, setSentToast] = useState(false);
  const [replyError, setReplyError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingReplyStatus, setPendingReplyStatus] = useState<'In Progress' | 'Resolved' | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingFeedback, setIsDeletingFeedback] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!activeFeedback || !feedbacks.some((feedback) => feedback.id === activeFeedback.id)) {
      const nextFeedback = feedbacks[0] ?? null;
      setActiveFeedback(nextFeedback);
      setReplyText(nextFeedback?.adminReply || '');
    }
  }, [activeFeedback, feedbacks]);

  const filtered = feedbacks.filter((fb) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      fb.subject.toLowerCase().includes(q) ||
      fb.message.toLowerCase().includes(q) ||
      fb.senderName.toLowerCase().includes(q) ||
      fb.sitio.toLowerCase().includes(q);

    const matchS = filterStatus === 'All' || fb.status === filterStatus;
    return matchQ && matchS;
  });

  const handleSelect = (fb: FeedbackSuggestion) => {
    setActiveFeedback(fb);
    setReplyText(fb.adminReply || '');
    setSentToast(false);
    setReplyError('');
    setDeleteError('');
  };

  const handleDeleteFeedback = async () => {
    if (!activeFeedback) return;
    setIsDeletingFeedback(true);
    setDeleteError('');
    try {
      await onDeleteFeedback(activeFeedback.id);
      setIsDeleteConfirmOpen(false);
      setActiveFeedback(null);
      setReplyText('');
      setSentToast(false);
      setReplyError('');
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'The concern could not be deleted. Please try again.');
    } finally {
      setIsDeletingFeedback(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeFeedback || !pendingReplyStatus || !replyText.trim()) return;
    setIsSending(true);
    setReplyError('');
    setSentToast(false);
    try {
      const result = await onReplyFeedback(activeFeedback.id, replyText.trim(), pendingReplyStatus);
      setActiveFeedback({
        ...activeFeedback,
        adminReply: replyText.trim(),
        status: pendingReplyStatus,
      });
      setSentToast(true);
      setReplyError(result.message || '');
      setPendingReplyStatus(null);
      setTimeout(() => setSentToast(false), 5000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The reply could not be saved and emailed.';
      if (message.startsWith('Reply saved, but')) {
        setActiveFeedback({
          ...activeFeedback,
          adminReply: replyText.trim(),
          status: pendingReplyStatus,
        });
      }
      setReplyError(message);
    } finally {
      setIsSending(false);
    }
  };

  const templates = [
    'Thank you for your concern! We have endorsed this request to the Barangay Council Committee on Infrastructure for immediate action.',
    'Good day! Your query has been noted. Please visit the SK Desk on the 2nd Floor of the Barangay Hall with your Student ID.',
    'Action taken: The sports equipment has been replenished and is now ready for youth checkout.',
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Youth Concerns & Feedback Inbox</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Citizen suggestions, facility complaints, and scholarship inquiries submitted via public portal
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold px-2.5 py-1 rounded-md">
            {feedbacks.filter((f) => f.status === 'New').length} New Messages
          </span>
          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-1 rounded-md">
            {feedbacks.filter((f) => f.status === 'Resolved').length} Resolved
          </span>
        </div>
      </Reveal>

      {/* Main Inbox Split */}
      <Reveal className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-[650px]">
          
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="relative text-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search citizen messages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              {['All', 'New', 'In Progress', 'Resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-md font-semibold text-[11px] transition-colors cursor-pointer ${
                    filterStatus === st
                      ? 'bg-[#0F2C59] text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((fb) => {
              const isSelected = activeFeedback?.id === fb.id;
              return (
                <div
                  key={fb.id}
                  onClick={() => handleSelect(fb)}
                  className={`p-3.5 text-xs transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-l-[#0F2C59] dark:border-l-amber-400' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{fb.senderName}</span>
                    <span className={`px-2 py-0.2 rounded text-[10px] font-semibold ${
                      fb.status === 'New' 
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300' 
                        : fb.status === 'In Progress' 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' 
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {fb.status}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{fb.subject}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5">{fb.message}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                    <span>{fb.sitio}</span>
                    <span className="font-mono">{fb.submittedAt.split(' ')[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Detail & Reply (7 cols) */}
        {activeFeedback ? (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-5">
            
            <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-semibold text-[11px]">
                  {activeFeedback.category}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{activeFeedback.submittedAt}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('');
                      setIsDeleteConfirmOpen(true);
                    }}
                    disabled={isSending || isDeletingFeedback}
                    aria-label={`Delete concern: ${activeFeedback.subject}`}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 px-2 py-1 font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{activeFeedback.subject}</h3>
              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-2">
                <span>From: <strong className="text-slate-800 dark:text-slate-200">{activeFeedback.senderName}</strong></span>
                <span>·</span>
                <span>Sitio: <strong className="text-slate-800 dark:text-slate-200">{activeFeedback.sitio}</strong></span>
                {activeFeedback.email && (
                  <>
                    <span>·</span>
                    <span>Email: <strong className="break-all text-slate-800 dark:text-slate-200">{activeFeedback.email}</strong></span>
                  </>
                )}
                {activeFeedback.isAnonymous && (
                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                    Anonymous
                  </span>
                )}
              </div>
            </div>

            {sentToast && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{replyError || 'Reply saved and emailed to the sender.'}</span>
              </div>
            )}
            {replyError && !sentToast && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {replyError}
              </p>
            )}

            {/* Message Body */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
              {activeFeedback.message}
            </div>

            {/* Template Quick Inserts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Quick Action Response Templates
              </span>
              <div className="space-y-1 text-xs">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => setReplyText(tpl)}
                    className="w-full text-left p-2 rounded-lg bg-slate-100/70 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 text-[11px] truncate block transition-colors cursor-pointer"
                  >
                    "{tpl}"
                  </button>
                ))}
              </div>
            </div>

            {/* Official Reply Box */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                Official Council Action & Reply
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeFeedback.email
                  ? `Saving a reply will email it to ${activeFeedback.email} from skbagbaguin.2023@gmail.com.`
                  : 'This is an anonymous message with no email address; the reply will only be logged.'}
              </p>
              <textarea
                rows={4}
                placeholder="Type response to citizen or log internal resolution notes..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={isSending}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setPendingReplyStatus('In Progress')}
                  disabled={isSending || !replyText.trim()}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer shadow-xs disabled:opacity-60"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => setPendingReplyStatus('Resolved')}
                  disabled={isSending || !replyText.trim()}
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSending
                    ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-amber-400" />
                    : <Send className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{isSending ? 'Sending...' : 'Send & Mark Resolved'}</span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 dark:text-slate-500 text-xs">
            Select a feedback thread from the left to inspect and reply.
          </div>
        )}

      </Reveal>
      <ConfirmationModal
        isOpen={pendingReplyStatus !== null}
        title={activeFeedback?.email ? 'Email this official reply?' : 'Save this council action?'}
        message={replyError || (activeFeedback?.email
          ? `This reply will be sent to ${activeFeedback.email} from skbagbaguin.2023@gmail.com and the message status will change to ${pendingReplyStatus}.`
          : `No email address was provided. Save the reply to the inbox and change the status to ${pendingReplyStatus} without sending an email?`)}
        confirmLabel={activeFeedback?.email ? 'Save & Send Reply' : 'Save Reply'}
        isLoading={isSending}
        onConfirm={handleSendReply}
        onCancel={() => setPendingReplyStatus(null)}
      />
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        title="Delete this concern?"
        message={deleteError || `This will permanently delete "${activeFeedback?.subject ?? 'this concern'}" from the admin inbox and database. This action cannot be undone.`}
        confirmLabel="Delete Concern"
        isLoading={isDeletingFeedback}
        onConfirm={handleDeleteFeedback}
        onCancel={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteError('');
        }}
      />

    </div>
  );
};
