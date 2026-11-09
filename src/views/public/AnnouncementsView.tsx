import React, { useState } from 'react';
import { Announcement, AnnouncementCategory } from '../../types/index.ts';
import { ArrowLeft, ArrowRight, Bell, Calendar, Pin, Search, User } from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';
import { PortalImage } from '../../components/PortalImage.tsx';
import { getDefaultAnnouncementCoverImage } from '../../data/defaultAnnouncements.ts';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  selectedAnnouncementId: string | null;
  onSelectAnnouncement: (announcement: Announcement) => void;
  onBackFromAnnouncement: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  announcements,
  selectedAnnouncementId,
  onSelectAnnouncement,
  onBackFromAnnouncement,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | AnnouncementCategory>('All');

  const categories: ('All' | AnnouncementCategory)[] = [
    'All',
    'Scholarships',
    'Youth Assemblies',
    'Sports Leagues',
    'Public Safety',
    'Health',
    'General Notice',
  ];

  const filtered = announcements.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const featured = filtered.find((a) => a.isPinned) || filtered[0];
  const listAnnouncements = filtered.filter((a) => a.id !== featured?.id);
  const selectedAnnouncement = announcements.find((announcement) => announcement.id === selectedAnnouncementId);

  if (selectedAnnouncementId) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onBackFromAnnouncement}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#0F2C59] transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 dark:text-amber-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to announcements
        </button>

        {selectedAnnouncement ? (
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {(selectedAnnouncement.coverImage || getDefaultAnnouncementCoverImage(selectedAnnouncement.id)) && (
              <div className="relative max-h-[34rem] overflow-hidden bg-slate-100 dark:bg-slate-800">
                <PortalImage
                  src={selectedAnnouncement.coverImage}
                  fallbackSrc={getDefaultAnnouncementCoverImage(selectedAnnouncement.id)}
                  alt=""
                  className="max-h-[34rem] w-full object-contain"
                />
              </div>
            )}
            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {selectedAnnouncement.isPinned && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <Pin className="h-3.5 w-3.5 fill-current" />
                    Pinned advisory
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {selectedAnnouncement.category}
                </span>
              </div>
              <h1 className="mt-4 text-2xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-3xl">
                {selectedAnnouncement.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 pb-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {selectedAnnouncement.date}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {selectedAnnouncement.author}
                </span>
              </div>
              <div className="mt-6 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-200 sm:text-base">
                {selectedAnnouncement.content}
              </div>
            </div>
          </article>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Announcement not found</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">It may have been removed or is no longer available.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Banner */}
      <Reveal className="bg-[#0F2C59] text-white rounded-2xl p-6 sm:p-10 border border-navy-800 shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-white/10 px-3 py-1 rounded-full">
            <Bell className="w-3.5 h-3.5" />
            <span>Official Sangguniang Kabataan Gazette</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Official Announcements & Public Notices
          </h1>
          <p className="text-xs sm:text-sm text-slate-200">
            Read verified releases, scholarship payout schedules, youth assemblies, tournament brackets, and disaster preparedness advisories.
          </p>
        </div>
      </Reveal>

      {/* Filter Bar */}
      <Reveal className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search announcements by keywords, dates, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 dark:text-slate-500 font-semibold shrink-0">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0F2C59] text-white shadow-xs dark:bg-amber-500 dark:text-slate-950'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </Reveal>

      {/* Featured Main Announcement */}
      {featured && (
        <Reveal className="relative overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-amber-500/40 dark:bg-slate-900">
          <div className={`grid ${featured.coverImage || getDefaultAnnouncementCoverImage(featured.id) ? 'md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]' : 'grid-cols-1'}`}>
            {(featured.coverImage || getDefaultAnnouncementCoverImage(featured.id)) && (
              <div className="relative h-44 overflow-hidden bg-slate-100 sm:h-52 md:h-full md:min-h-64 dark:bg-slate-800">
                <PortalImage
                  src={featured.coverImage}
                  fallbackSrc={getDefaultAnnouncementCoverImage(featured.id)}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#0F2C59]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-300 shadow-sm backdrop-blur-sm">
                  <Pin className="h-3 w-3 fill-current" />
                  Pinned advisory
                </span>
              </div>
            )}

            <div className="flex min-w-0 flex-col justify-center p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                {!featured.coverImage && !getDefaultAnnouncementCoverImage(featured.id) && (
                  <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                    <Pin className="h-3.5 w-3.5 fill-current" />
                    Pinned advisory
                  </span>
                )}
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                  {featured.category}
                </span>
              </div>

              <h2 className="mt-3 text-lg font-extrabold leading-snug text-slate-900 dark:text-white sm:text-xl">
                {featured.title}
              </h2>

              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                {featured.excerpt}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="font-mono text-slate-700 dark:text-slate-300">{featured.date}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-slate-700 dark:text-slate-300">{featured.author}</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectAnnouncement(featured)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2C59] px-3.5 py-2 font-bold text-white transition-colors hover:bg-[#173B72] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 cursor-pointer"
                >
                  <span>Read Full Advisory</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Announcements List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listAnnouncements.map((ann, index) => (
          <Reveal
            key={ann.id}
            delay={index * 100}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-amber-600 dark:text-amber-400">{ann.category}</span>
                <span className="font-mono text-[11px]">{ann.date}</span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                {ann.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {ann.excerpt}
              </p>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[200px]">{ann.author}</span>
              <button
                onClick={() => onSelectAnnouncement(ann)}
                className="text-xs font-bold text-[#0F2C59] dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
              >
                Read More →
              </button>
            </div>
          </Reveal>
        ))}
      </div>

    </div>
  );
};
