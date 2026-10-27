import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Facebook } from 'lucide-react';
import Reveal from './Reveal.jsx';
import FacebookPostCard from './FacebookPostCard.jsx';
import { getDefaultAnnouncementCoverImage } from '../data/defaultAnnouncements.ts';
import { PortalImage } from './PortalImage.tsx';
/** @typedef {import('../types/index.ts').FacebookPost} FacebookPost */

/** @param {{ announcements: import('../types/index.ts').Announcement[], facebookPosts?: FacebookPost[] }} props */
export default function Announcements({ announcements, facebookPosts = [] }) {
  const publishedAnnouncements = announcements;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const hasMultipleAnnouncements = publishedAnnouncements.length > 1;
  const activeAnnouncement = publishedAnnouncements[activeIndex % Math.max(publishedAnnouncements.length, 1)];
  const latestFacebookPosts = facebookPosts.length > 0
    ? facebookPosts.slice(0, 2)
    : publishedAnnouncements.filter((announcement) => announcement.sourcePostUrl?.trim()).slice(0, 2);

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
              {(activeAnnouncement.coverImage || getDefaultAnnouncementCoverImage(activeAnnouncement.id)) && (
                <div className="relative isolate h-48 w-full overflow-hidden bg-slate-200 sm:h-56 dark:bg-slate-800">
                  <PortalImage
                    src={activeAnnouncement.coverImage}
                    fallbackSrc={getDefaultAnnouncementCoverImage(activeAnnouncement.id)}
                    alt=""
                    ariaHidden
                    className="absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-xl"
                  />
                  <PortalImage
                    src={activeAnnouncement.coverImage}
                    fallbackSrc={getDefaultAnnouncementCoverImage(activeAnnouncement.id)}
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

      {latestFacebookPosts.length > 0 && (
        <div className="mt-12 border-t border-slate-200 pt-10 dark:border-slate-800">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Latest from Facebook</h2>
              <span className="mt-2 block h-1 w-9 rounded-full bg-amber-400" />
            </div>
            <a
              href="https://web.facebook.com/sk.bagbaguin.valenzuela"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1877F2] transition-colors hover:text-[#166FE5] hover:underline"
            >
              <Facebook className="h-3.5 w-3.5 fill-current" />
              <span>Follow us</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {latestFacebookPosts.map((announcement) => (
              <article
                key={announcement.id}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                {(announcement.coverImage || getDefaultAnnouncementCoverImage(announcement.id)) && (
                  <div className="h-44 overflow-hidden bg-slate-200 dark:bg-slate-800">
                    <PortalImage
                      src={announcement.imageUrl || announcement.coverImage}
                      fallbackSrc={getDefaultAnnouncementCoverImage(announcement.id)}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="flex min-h-36 flex-col p-4">
                  <p className="line-clamp-3 text-xs font-semibold uppercase leading-relaxed tracking-wide text-slate-600 dark:text-slate-300">
                    {announcement.title}
                  </p>
                  <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {announcement.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4 text-[11px] text-slate-400 dark:text-slate-500">
                    <span>{announcement.date}</span>
                    <a
                      href={announcement.postUrl || announcement.sourcePostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#1877F2] hover:underline"
                    >
                      <span>View Post</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </Reveal>
  );
}
