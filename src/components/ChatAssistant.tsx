import React, { useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, LoaderCircle, Send, X } from 'lucide-react';
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
        <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="sk-bagbaguin-assistant-title" className="fixed inset-0 flex flex-col bg-white dark:bg-slate-900 sm:absolute sm:inset-auto sm:bottom-16 sm:right-0 sm:h-[min(36rem,calc(100vh-7rem))] sm:w-[min(24rem,calc(100vw-2rem))] sm:rounded-2xl sm:border sm:border-slate-200 sm:shadow-2xl dark:sm:border-slate-700">
          <div className="flex items-center justify-between bg-[#0F2C59] px-4 py-3 text-white">
          <div className="flex items-center gap-2"><Bot className="h-5 w-5 text-amber-400" /><div><p id="sk-bagbaguin-assistant-title" className="text-sm font-bold">SK Bagbaguin Digital Assistant</p><p className="text-[10px] text-slate-200">Verified public information only</p></div></div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => { abortRef.current?.abort(); setMessages([initialMessage]); setInput(''); setError(''); }} className="rounded px-2 py-1 text-[10px] hover:bg-white/10">New chat</button>
              <button ref={closeButtonRef} type="button" onClick={() => { abortRef.current?.abort(); setIsOpen(false); }} aria-label="Close assistant" className="rounded-lg p-1 hover:bg-white/10"><X className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
            {messages.length === 1 && <div className="flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void send(suggestion)} disabled={isLoading} className="rounded-full border border-slate-300 px-2.5 py-1.5 text-left text-[11px] text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">{suggestion}</button>)}</div>}
            {messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><p onClick={() => navigateFromText(message.content)} className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed ${message.role === 'user' ? 'bg-[#0F2C59] text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>{message.content}</p></div>)}
            {isLoading && <div className="flex justify-start"><p className="rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"><LoaderCircle className="h-4 w-4 animate-spin" aria-label="Assistant is typing" /></p></div>}
            {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
          </div>
          <div className="border-t border-slate-200 p-3 dark:border-slate-700">
            <div className="mb-1 flex justify-between gap-2 text-[10px] text-slate-500"><span>Huwag mag-share ng personal information dito. / Please don't share personal information here.</span><span>{input.length}/500</span></div>
            <div className="flex items-center gap-2"><input value={input} maxLength={500} disabled={isLoading} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void send(); }} placeholder="Ask about SK Bagbaguin..." aria-label="Ask SK Bagbaguin Digital Assistant" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#0F2C59] dark:border-slate-600 dark:bg-slate-800" /><button type="button" onClick={() => void send()} disabled={isLoading || !input.trim()} aria-label="Send message" className="rounded-lg bg-[#0F2C59] p-2 text-white disabled:opacity-50"><Send className="h-4 w-4 text-amber-400" /></button></div>
          </div>
        </div>
      )}
      <button type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen} aria-label={isOpen ? 'Close SK Bagbaguin Digital Assistant' : 'Open SK Bagbaguin Digital Assistant'} className="flex items-center gap-2 rounded-full bg-[#0F2C59] px-4 py-3 text-xs font-bold text-white shadow-xl hover:bg-[#0b2348]">{isOpen ? <ChevronDown className="h-4 w-4 text-amber-400" /> : <Bot className="h-4 w-4 text-amber-400" />}{isOpen ? 'Close' : 'Ask SK Assistant'}</button>
    </div>
  );
};
