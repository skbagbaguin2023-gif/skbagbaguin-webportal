import { Check, Copy, ExternalLink, MapPin, Navigation, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import Reveal from './Reveal.jsx';

const MAP_QUERY = '1625 P. Jacinto, Valenzuela, 1448 Metro Manila';
const MAP_EMBED_URL = `https://www.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&output=embed`;
const MAP_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MAP_QUERY)}`;
const ADDRESS = '1625 P. Jacinto, Valenzuela, 1448 Metro Manila';

export default function LocationMap({ compact = false }) {
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(14);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(ADDRESS);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Reveal as="section" className={compact ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-center'}>
        <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-lg dark:border-slate-800 dark:bg-slate-800">
          <iframe
            src={`${MAP_EMBED_URL}&z=${zoom}`}
            title="SK Bagbaguin location"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full sm:h-96"
          />
          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-xs font-bold text-[#0F2C59] shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live location preview
          </div>
          <div className="absolute bottom-3 right-3 flex overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-lg dark:border-slate-700 dark:bg-slate-900/95">
            <button type="button" onClick={() => setZoom((current) => Math.min(current + 1, 19))} aria-label="Zoom in map" className="p-2.5 text-[#0F2C59] hover:bg-amber-50 dark:text-white dark:hover:bg-slate-800"><Plus className="h-4 w-4" /></button>
            <button type="button" onClick={() => setZoom((current) => Math.max(current - 1, 10))} aria-label="Zoom out map" className="border-l border-slate-200 p-2.5 text-[#0F2C59] hover:bg-amber-50 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"><Minus className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">Open today</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Find Us</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{ADDRESS}</p>
            <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Office hours: 8:00 AM - 5:00 PM</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void copyAddress()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:border-amber-300 hover:bg-amber-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy address'}
            </button>
            <a href={MAP_SEARCH_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-[#0F2C59] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0b2348]">
              <Navigation className="h-3.5 w-3.5 text-amber-300" />
              Get directions
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
