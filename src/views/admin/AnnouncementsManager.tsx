import React, { useState } from 'react';
import { Announcement, AnnouncementCategory, AnnouncementStatus } from '../../types/index.ts';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle, 
  XCircle, 
  X, 
  Pin,
  Check
} from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';

interface AnnouncementsManagerProps {
  announcements: Announcement[];
  onAddAnnouncement: (ann: Announcement) => void;
  onUpdateAnnouncement: (ann: Announcement) => void;
  onDeleteAnnouncement: (id: string) => void;
  isCreateOpenInitially?: boolean;
  onCloseCreateModal?: () => void;
}

export const AnnouncementsManager: React.FC<AnnouncementsManagerProps> = ({
  announcements,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  isCreateOpenInitially = false,
  onCloseCreateModal,
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(isCreateOpenInitially);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formExcerpt, setFormExcerpt] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formSourcePostUrl, setFormSourcePostUrl] = useState('');
  const [formCategory, setFormCategory] = useState<AnnouncementCategory>('Scholarships');
  const [formAuthor, setFormAuthor] = useState('');
  const [formStatus, setFormStatus] = useState<AnnouncementStatus>('Published');
  const [formIsPinned, setFormIsPinned] = useState(false);

  const categories: AnnouncementCategory[] = [
    'Scholarships',
    'Youth Assemblies',
    'Sports Leagues',
    'Public Safety',
    'Health',
    'General Notice',
  ];

  const filtered = announcements.filter((a) => {
    const q = search.toLowerCase();
    const matchQ = !q || a.title.toLowerCase().includes(q) || a.author.toLowerCase().includes(q);
    const matchC = filterCategory === 'All' || a.category === filterCategory;
    return matchQ && matchC;
  });

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormExcerpt('');
    setFormContent('');
    setFormCoverImage('');
    setFormSourcePostUrl('');
    setFormCategory('Scholarships');
    setFormAuthor('');
    setFormStatus('Published');
    setFormIsPinned(false);
    setIsModalOpen(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingId(ann.id);
    setFormTitle(ann.title);
    setFormExcerpt(ann.excerpt);
    setFormContent(ann.content);
    setFormCoverImage(ann.coverImage || '');
    setFormSourcePostUrl(ann.sourcePostUrl || '');
    setFormCategory(ann.category);
    setFormAuthor(ann.author);
    setFormStatus(ann.status);
    setFormIsPinned(!!ann.isPinned);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    if (onCloseCreateModal) onCloseCreateModal();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (editingId) {
      const existing = announcements.find((a) => a.id === editingId);
      if (existing) {
        onUpdateAnnouncement({
          ...existing,
          title: formTitle,
          excerpt: formExcerpt,
          content: formContent,
          coverImage: formCoverImage.trim() || undefined,
          sourcePostUrl: formSourcePostUrl.trim() || undefined,
          category: formCategory,
          author: formAuthor,
          status: formStatus,
          isPinned: formIsPinned,
        });
      }
    } else {
      const newAnn: Announcement = {
        id: `ann-${Date.now()}`,
        title: formTitle,
        excerpt: formExcerpt,
        content: formContent,
        coverImage: formCoverImage.trim() || undefined,
        sourcePostUrl: formSourcePostUrl.trim() || undefined,
        category: formCategory,
        author: formAuthor,
        date: today,
        status: formStatus,
        isPinned: formIsPinned,
      };
      onAddAnnouncement(newAnn);
    }
    closeModal();
  };

  const toggleStatus = (ann: Announcement) => {
    onUpdateAnnouncement({
      ...ann,
      status: ann.status === 'Published' ? 'Draft' : 'Published',
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Official Announcements Manager</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Publish, schedule, and edit public notices, scholarships, and advisories</p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Announcement</span>
        </button>
      </Reveal>

      {/* Filter and Search Bar */}
      <Reveal className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 dark:text-slate-400 font-semibold">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </Reveal>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Title & Excerpt</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Author / Committee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((ann) => (
                <tr key={ann.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 max-w-sm">
                    <div className="flex items-center gap-1.5">
                      {ann.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                      <span className="font-bold text-slate-900 dark:text-white truncate block">{ann.title}</span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate block mt-0.5">{ann.excerpt}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded text-[11px]">
                      {ann.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[160px]">{ann.author}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{ann.date}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleStatus(ann)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        ann.status === 'Published'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/60'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title="Click to toggle status"
                    >
                      {ann.status}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(ann)}
                        className="p-1 text-slate-600 dark:text-slate-300 hover:text-[#0F2C59] dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                        title="Edit announcement"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${ann.title}"?`)) {
                            onDeleteAnnouncement(ann.id);
                          }
                        }}
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0F2C59] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingId ? 'Edit Official Announcement' : 'Post New Official Announcement'}
              </h3>
              <button onClick={closeModal} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Announcement Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule of Educational Assistance Payout"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AnnouncementCategory)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AnnouncementStatus)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Published">Published (Public)</option>
                    <option value="Draft">Draft (Internal)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Author / Issuing Councilor
                </label>
                <input
                  type="text"
                  required
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Excerpt / Brief Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="1-2 sentences for card previews"
                  value={formExcerpt}
                  onChange={(e) => setFormExcerpt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Announcement Content *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write full advisory guidelines, bullet points, schedules, and instructions..."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-sans bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Cover Image URL
                </label>
                <input
                  type="text"
                  value={formCoverImage}
                  onChange={(e) => setFormCoverImage(e.target.value)}
                  placeholder="Optional image URL"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Facebook Source Post URL
                </label>
                <input
                  type="url"
                  value={formSourcePostUrl}
                  onChange={(e) => setFormSourcePostUrl(e.target.value)}
                  placeholder="Optional direct link to this announcement's Facebook post"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="w-4 h-4 text-[#0F2C59] dark:accent-amber-500 rounded"
                />
                <label htmlFor="pinCheck" className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  Pin to Top of Public Announcements Board
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-xs cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
