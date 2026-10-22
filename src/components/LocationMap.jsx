import { ExternalLink, MapPin } from 'lucide-react';
import Reveal from './Reveal.jsx';

const MAP_EMBED_URL = 'https://www.google.com/maps?q=1625+P.+Jacinto,+Valenzuela,+1448+Metro+Manila&output=embed';
const MAP_SEARCH_URL = 'https://www.google.com/maps/search/?api=1&query=1625+P.+Jacinto,+Valenzuela,+1448+Metro+Manila';
const ADDRESS = '1625 P. Jacinto, Valenzuela, 1448 Metro Manila';

export default function LocationMap({ compact = false }) {
  return (
    <Reveal as="section" className={compact ? 'w-full' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}>
      <div className={compact ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-center'}>
        <iframe
          src={MAP_EMBED_URL}
          title="SK Bagbaguin location"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-72 sm:h-96 rounded-2xl border border-slate-200 dark:border-slate-800"
        />
        <div className="space-y-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Find Us</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{ADDRESS}</p>
          <a
            href={MAP_SEARCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2C59] hover:bg-[#0b2348] px-4 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </Reveal>
  );
}
