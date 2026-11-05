import React, { useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, LoaderCircle, RotateCcw, Send, ShieldCheck, X } from 'lucide-react';
import { sendAiChat, type ChatMessage } from '../services/aiChat.ts';

interface ChatAssistantProps {
  onNavigate: (page: 'home' | 'about' | 'programs' | 'events' | 'announcements' | 'services' | 'transparency' | 'contact') => void;
}

const suggestions = [
  'What services does SK Bagbaguin offer?',
  'What are the requirements for a barangay certificate?',
  'Where is the barangay office located?',
  'What are the latest announcements?',
  'How can I contact the SK officials?',
  'How do I report a concern?',
];

const initialMessage: ChatMessage = {
  role: 'assistant',
  content: 'Hello po! I’m the SK Bagbaguin Digital Assistant. I can help you find verified information about programs, services, announcements, requirements, and official contact channels.',
};

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        abortRef.current?.abort();
        setIsOpen(false);
      }
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll<HTMLElement>('button, input');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setShowIdlePrompt(false);
      return undefined;
    }

    const promptTimer = window.setTimeout(() => setShowIdlePrompt(true), 3500);
    return () => window.clearTimeout(promptTimer);
  }, [isOpen]);

  const navigateFromText = (text: string) => {
    const match = text.match(/(?:^|\s)(\/(?:about|programs|events|announcements|services|transparency|contact))(?:\s|$)/);
    if (match) onNavigate(match[1].slice(1) as Parameters<typeof onNavigate>[0]);
  };

  const send = async (value = input) => {
    const content = value.trim();
    if (!content || isLoading) return;
    if (content.length > 500) {
      setError('Please keep your message under 500 characters.');
      return;
    }
    const nextMessages: ChatMessage[] = [...messages, { role: 'user' as const, content }].slice(-10);
    setInput('');
    setError('');
    setIsLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const result = await sendAiChat(content, { userRole: 'guest', currentPage: window.location.pathname }, messages.slice(-9), { signal: controller.signal });
      setMessages([...nextMessages, { role: 'assistant' as const, content: result.reply }].slice(-10));
    } catch (caught) {
      if (!controller.signal.aborted) {
        setError(caught instanceof Error ? caught.message : 'The assistant is temporarily unavailable.');
        setMessages(nextMessages);
      }
    } finally {
      abortRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen && (
        <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="sk-bagbaguin-assistant-title" className="fixed inset-0 flex flex-col overflow-hidden bg-slate-50 text-slate-900 shadow-2xl dark:bg-slate-950 dark:text-white sm:absolute sm:inset-auto sm:bottom-16 sm:right-0 sm:h-[min(40rem,calc(100vh-7rem))] sm:w-[min(26rem,calc(100vw-2rem))] sm:rounded-[1.35rem] sm:border sm:border-white/70 sm:shadow-[0_24px_70px_-20px_rgba(8,24,48,.65)] dark:sm:border-slate-700">
          <div className="relative shrink-0 overflow-hidden bg-[#0F2C59] px-4 py-4 text-white">
            <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-amber-400/20 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-[#0F2C59] shadow-lg shadow-black/10">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p id="sk-bagbaguin-assistant-title" className="text-sm font-extrabold tracking-tight">SK Bagbaguin Assistant</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Verified public information</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => { abortRef.current?.abort(); setMessages([initialMessage]); setInput(''); setError(''); }} aria-label="Start a new chat" className="rounded-lg p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"><RotateCcw className="h-3.5 w-3.5" /></button>
                <button ref={closeButtonRef} type="button" onClick={() => { abortRef.current?.abort(); setIsOpen(false); }} aria-label="Close assistant" className="rounded-lg p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="relative mt-3 flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-2.5 py-2 text-[10px] text-slate-200">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-amber-300" />
              <span>Ask about programs, services, announcements, or contacts.</span>
            </div>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-4 dark:from-slate-950 dark:to-slate-900" aria-live="polite">
            {messages.length === 1 && (
              <div className="space-y-2">
                <p className="px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Suggested questions</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void send(suggestion)} disabled={isLoading} className="group rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-[11px] font-medium leading-snug text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-500/60 dark:hover:bg-slate-800">{suggestion}<span className="ml-1 text-amber-500 opacity-0 transition group-hover:opacity-100">→</span></button>)}
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.role === 'assistant' && <div className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0F2C59] text-amber-300"><Bot className="h-3.5 w-3.5" /></div>}
                <p onClick={() => navigateFromText(message.content)} className={`max-w-[84%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${message.role === 'user' ? 'rounded-br-md bg-[#0F2C59] text-white shadow-[#0F2C59]/15' : 'rounded-bl-md border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{message.content}</p>
              </div>
            ))}
            {isLoading && <div className="flex items-end gap-2"><div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0F2C59] text-amber-300"><Bot className="h-3.5 w-3.5" /></div><div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-3 dark:border-slate-700 dark:bg-slate-800"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-.2s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-.1s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-500" /><LoaderCircle className="sr-only" aria-label="Assistant is typing" /></div></div>}
            {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">{error}</p>}
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-slate-400"><span>Do not share personal information.</span><span className={input.length > 450 ? 'text-amber-600' : ''}>{input.length}/500</span></div>
            <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100 dark:border-slate-700 dark:bg-slate-900 dark:focus-within:ring-amber-950">
              <input value={input} maxLength={500} disabled={isLoading} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void send(); }} placeholder="Ask about SK Bagbaguin..." aria-label="Ask SK Bagbaguin Digital Assistant" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs outline-none placeholder:text-slate-400 disabled:opacity-60 dark:text-white" />
              <button type="button" onClick={() => void send()} disabled={isLoading || !input.trim()} aria-label="Send message" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0F2C59] text-white transition hover:bg-[#173B72] disabled:cursor-not-allowed disabled:opacity-40"><Send className="h-4 w-4 text-amber-300" /></button>
            </div>
          </div>
        </div>
      )}
      {!isOpen && showIdlePrompt && (
        <div role="status" className="absolute bottom-full right-0 mb-3 w-[min(18rem,calc(100vw-2rem))] animate-in slide-in-from-bottom-2 fade-in rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0F2C59] text-amber-300"><Bot className="h-4 w-4" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white">Need help?</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">Ask me about SK programs, services, announcements, or contact details.</p>
            </div>
            <button type="button" onClick={() => setShowIdlePrompt(false)} aria-label="Dismiss assistant prompt" className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"><X className="h-3.5 w-3.5" /></button>
          </div>
          <div className="absolute -bottom-1.5 right-7 h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
        </div>
      )}
      <button
        type="button"
        onClick={() => {
          setShowIdlePrompt(false);
          setIsOpen((current) => !current);
        }}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close SK Bagbaguin Digital Assistant' : 'Open SK Bagbaguin Digital Assistant'}
        className="group flex items-center gap-2 rounded-full bg-[#0F2C59] px-4 py-3 text-xs font-bold text-white shadow-[0_12px_30px_-8px_rgba(15,44,89,.75)] transition hover:-translate-y-0.5 hover:bg-[#173B72]"
      >
        {isOpen ? <ChevronDown className="h-4 w-4 text-amber-300" /> : <span className="relative"><Bot className="h-4 w-4 text-amber-300" /><span className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-[#0F2C59]" /></span>}
        {isOpen ? 'Close' : 'Ask SK Assistant'}
      </button>
    </div>
  );
};
