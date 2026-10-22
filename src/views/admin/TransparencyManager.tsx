import React, { useState } from 'react';
import { TransparencyDoc, DocCategory } from '../../types/index.ts';
import { 
  Upload, 
  Search, 
  FileText, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  X, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

interface TransparencyManagerProps {
  documents: TransparencyDoc[];
  onAddDoc: (doc: TransparencyDoc) => void;
  onUpdateDoc: (doc: TransparencyDoc) => void;
  onDeleteDoc: (id: string) => void;
}

export const TransparencyManager: React.FC<TransparencyManagerProps> = ({
  documents,
  onAddDoc,
  onUpdateDoc,
  onDeleteDoc,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New report form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DocCategory>('Accomplishment Report');
  const [formYear, setFormYear] = useState(2026);
  const [formQuarter, setFormQuarter] = useState('Q4');
  const [formResolution, setFormResolution] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(true);

  const categories: DocCategory[] = [
    'Annual Investment Plan (AIP)',
    'CBYDP',
    'Financial & Liquidation',
    'Accomplishment Report',
    'SK Resolution',
  ];

  const filtered = documents.filter(
    (d) => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newDoc: TransparencyDoc = {
      id: `doc-${Date.now()}`,
      title: formTitle,
      category: formCategory,
      year: Number(formYear),
      quarter: formQuarter,
      documentType: 'PDF',
      fileSize: '1.8 MB',
      resolutionNumber: formResolution || undefined,
      publishedDate: today,
      isPublic: formIsPublic,
      description: formDescription,
    };

    onAddDoc(newDoc);
    setIsModalOpen(false);
  };

  const toggleVisibility = (doc: TransparencyDoc) => {
    onUpdateDoc({
      ...doc,
      isPublic: !doc.isPublic,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transparency & Financial Documents CMS</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish Commission on Audit liquidation summaries, AIP budgets, and legislative resolutions
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Upload Official Report</span>
        </button>
      </div>

      {/* Drag & Drop Quick Upload Area */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center space-y-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
        <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Drag & Drop Audited Financial Reports</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Upload PDF scans of COA audited disbursements, SK resolutions, or youth development plans (Up to 25MB)
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="mt-2 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0F2C59] dark:text-amber-400 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          Select File to Upload
        </button>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-72 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by title or resolution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{filtered.length} Documents on Record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Year & Resolution</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4">Public Visibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 max-w-xs">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">{doc.title}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate block">{doc.description}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[#0F2C59] dark:text-amber-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                    <div>{doc.year} {doc.quarter ? `(${doc.quarter})` : ''}</div>
                    {doc.resolutionNumber && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">{doc.resolutionNumber}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{doc.publishedDate}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleVisibility(doc)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                        doc.isPublic
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {doc.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{doc.isPublic ? 'Public' : 'Restricted'}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${doc.title}"?`)) onDeleteDoc(doc.id);
                      }}
                      className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0F2C59] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">Upload Official Transparency Document</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDoc} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SK Bagbaguin 4th Quarter Financial Liquidation Report"
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
                    onChange={(e) => setFormCategory(e.target.value as DocCategory)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Fiscal Year
                  </label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Council Resolution Tracking No. (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SK Res. No. 07-2026"
                  value={formResolution}
                  onChange={(e) => setFormResolution(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Summary / Scope Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsPublic}
                    onChange={(e) => setFormIsPublic(e.target.checked)}
                    className="w-4 h-4 text-[#0F2C59] dark:accent-amber-500 rounded"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Publish immediately to Public Transparency Board
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white font-bold px-5 py-2 rounded-lg text-xs cursor-pointer shadow-xs"
                >
                  Confirm & Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
