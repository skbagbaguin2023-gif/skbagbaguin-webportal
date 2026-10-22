import { ExternalLink, Users } from 'lucide-react';
import postcardImg1 from '../assets/images/postcardImg1.jpg';
import skLogo from '../assets/images/skLogo.png';

export const FACEBOOK_PAGE_URL = 'https://web.facebook.com/sk.bagbaguin.valenzuela';

export default function FacebookPostCard() {
  return (
    <aside className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <div className="relative h-28 overflow-hidden bg-[#0F2C59]">
        <img src={postcardImg1} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#081830]/75 via-[#0F2C59]/50 to-[#081830]/55" />
        <span className="absolute bottom-3 left-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
          Official Facebook Page
        </span>
      </div>

      <div className="px-5 pb-5">
        <div className="relative z-10 -mt-9 flex items-end justify-between gap-3">
          <img
            src={skLogo}
            alt="SK Bagbaguin logo"
            className="h-[4.5rem] w-[4.5rem] rounded-full border-4 border-white bg-white object-contain shadow-md dark:border-slate-900"
          />
          <a
            href={FACEBOOK_PAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-1 inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#166FE5]"
          >
            <span>Follow Page</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">SK Bagbaguin Valenzuela</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sangguniang Kabataan ng Barangay Bagbaguin</p>

        <div className="mt-5 flex items-start gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#1877F2] dark:bg-blue-950/50">
            <Users className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Our community of followers</p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Follow the official page for announcements, programs, and community updates.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}