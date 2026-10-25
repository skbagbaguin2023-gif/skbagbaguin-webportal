import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Reveal from './Reveal.jsx';
import FacebookPostCard from './FacebookPostCard.jsx';

export default function Announcements({ announcements }) {
  const publishedAnnouncements = announcements.filter((announcement) => announcement.status === 'Published');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const hasMultipleAnnouncements = publishedAnnouncements.length > 1;
  const activeAnnouncement = publishedAnnouncements[activeIndex % Math.max(publishedAnnouncements.length, 1)];

  useEffect(() => {
    setActiveIndex(0);
  }, [publishedAnnouncements.length]);

  useEffect(() => {
    if (!hasMultipleAnnouncements || isPaused) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % publishedAnnouncements.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [hasMultipleAnnouncements, isPaused, publishedAnnouncements.length]);

  const showPrevious = () => {
    setActiveIndex((index) => (index - 1 + publishedAnnouncements.length) % publishedAnnouncements.length);
  };

  const showNext = () => {
    setActiveIndex((index) => (index + 1) % publishedAnnouncements.length);
  };

  return (
    <Reveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
        <div
          role="region"
          aria-roledescription="carousel"
          aria-label="Latest announcements"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
          }}
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Latest Announcements</h2>
            {hasMultipleAnnouncements && (
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-medium tabular-nums text-slate-500 dark:text-slate-400" aria-live="polite">
                  {activeIndex + 1} / {publishedAnnouncements.length}
                </span>
                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Previous announcement"
                  className="rounded-full border border-slate-300 bg-white p-2 text-slate-700 shadow-xs transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next announcement"
                  className="rounded-full border border-slate-300 bg-white p-2 text-slate-700 shadow-xs transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
          {activeAnnouncement ? (
            <div
              key={activeAnnouncement.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              {activeAnnouncement.coverImage && (
                <div className="relative isolate h-48 w-full overflow-hidden bg-slate-200 sm:h-56 dark:bg-slate-800">
                  <img
                    src={activeAnnouncement.coverImage}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
                  />
                  <img
                    src={activeAnnouncement.coverImage}
                    alt=""
                    className="relative z-10 h-full w-full object-contain"
                  />
                </div>
              )}
              <div className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                  {activeAnnouncement.date}
                </p>
                <h3 className="mt-2 line-clamp-2 font-bold text-base text-slate-900 dark:text-white">
                  {activeAnnouncement.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {activeAnnouncement.excerpt}
                </p>
                {activeAnnouncement.sourcePostUrl?.trim() && (
                  <a
                    href={activeAnnouncement.sourcePostUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F2C59] hover:underline dark:text-amber-400"
                  >
                    <span>View Source Post</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No published announcements yet.</p>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5">Follow Our Facebook Page</h2>
          <FacebookPostCard />
        </div>
      </div>
    </Reveal>
  );
}
