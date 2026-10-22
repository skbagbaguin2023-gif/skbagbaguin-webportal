import React, { useState } from 'react';
import { Announcement, AnnouncementCategory } from '../../types/index.ts';
import { Bell, Search, Pin, Calendar, User, ArrowRight, X } from 'lucide-react';

interface AnnouncementsViewProps {
  announcements: Announcement[];
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({ announcements }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | AnnouncementCategory>('All');
  const [activeModalAnnouncement, setActiveModalAnnouncement] = useState<Announcement | null>(null);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Banner */}
      <div className="bg-[#0F2C59] text-white rounded-2xl p-6 sm:p-10 border border-navy-800 shadow-md">
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
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
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
      </div>

      {/* Featured Main Announcement */}
      {featured && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-400/60 dark:border-amber-500/50 p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">
            <Pin className="w-4 h-4 fill-amber-500 text-amber-600 dark:text-amber-400" />
            <span>PINNED OFFICIAL ADVISORY · {featured.category}</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {featured.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed max-w-4xl line-clamp-3">
            {featured.excerpt}
          </p>

          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="font-mono text-slate-700 dark:text-slate-300">{featured.date}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span className="text-slate-700 dark:text-slate-300">{featured.author}</span>
              </span>
            </div>

            <button
              onClick={() => setActiveModalAnnouncement(featured)}
              className="bg-[#0F2C59] hover:bg-navy-800 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Read Full Advisory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Announcements List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listAnnouncements.map((ann) => (
          <div
            key={ann.id}
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
                onClick={() => setActiveModalAnnouncement(ann)}
                className="text-xs font-bold text-[#0F2C59] dark:text-amber-400 hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
              >
                Read More →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Full Announcement Modal */}
      {activeModalAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0F2C59] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                  {activeModalAnnouncement.category}
                </span>
                <h2 className="text-base font-bold truncate max-w-md sm:max-w-lg">
                  {activeModalAnnouncement.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveModalAnnouncement(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-medium text-slate-700 dark:text-slate-300">{activeModalAnnouncement.author}</span>
                <span className="font-mono">{activeModalAnnouncement.date}</span>
              </div>

              <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line space-y-3 font-sans">
                {activeModalAnnouncement.content}
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setActiveModalAnnouncement(null)}
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-semibold px-5 py-2 rounded-lg cursor-pointer"
                >
                  Close Advisory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
