import { ExternalLink } from 'lucide-react';
import Reveal from './Reveal.jsx';
import FacebookPostCard from './FacebookPostCard.jsx';

export default function Announcements({ announcements }) {
  const publishedAnnouncements = announcements.filter((announcement) => announcement.status === 'Published');

  return (
    <Reveal as="section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5">Latest Announcements</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {publishedAnnouncements.map((announcement, index) => (
              <Reveal
                key={announcement.id}
                delay={index * 100}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs"
              >
                {announcement.coverImage && (
                  <img src={announcement.coverImage} alt="" className="w-full h-56 object-cover" />
                )}
                <div className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                    {announcement.date}
                  </p>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">{announcement.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{announcement.excerpt}</p>
                  {announcement.sourcePostUrl?.trim() && (
                    <a
                      href={announcement.sourcePostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F2C59] dark:text-amber-400 mt-4 hover:underline"
                    >
                      <span>View Source Post</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
            {publishedAnnouncements.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400">No published announcements yet.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-5">Follow Our Facebook Page</h2>
          <FacebookPostCard />
        </div>
      </div>
    </Reveal>
  );
}
