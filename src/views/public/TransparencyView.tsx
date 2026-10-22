import React, { useState } from 'react';
import { TransparencyDoc, DocCategory } from '../../types/index.ts';
import { 
  ShieldCheck, 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  Award, 
  Lock, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface TransparencyViewProps {
  documents: TransparencyDoc[];
  onPreviewDoc: (doc: TransparencyDoc) => void;
}

export const TransparencyView: React.FC<TransparencyViewProps> = ({
  documents,
  onPreviewDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | DocCategory>('All');
  const [selectedYear, setSelectedYear] = useState('All');

  const categories: ('All' | DocCategory)[] = [
    'All',
    'CBYDP',
    'Annual Investment Plan (AIP)',
    'Financial & Liquidation',
    'Accomplishment Report',
    'SK Resolution',
  ];

  const filtered = documents.filter((doc) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || doc.title.toLowerCase().includes(q) || doc.description.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesYear = selectedYear === 'All' || String(doc.year) === selectedYear;
    return matchesQuery && matchesCategory && matchesYear && doc.isPublic;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Banner */}
      <div className="bg-[#0F2C59] text-white rounded-2xl p-6 sm:p-10 border border-navy-800 shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-white/10 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Full Public Disclosure & COA Transparency</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Transparency Board & Public Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Every peso of the 10% Sangguniang Kabataan Fund belongs to the youth. Inspect our Annual Investment Plans, Commission on Audit reports, disbursement summaries, and legislative resolutions.
          </p>
        </div>
      </div>

      {/* Compliance Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">COA Circular 2020-004 Compliant</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Strict liquidation guidelines and quarterly bank reconciliations enforced.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">DILG Seal of Good Youth Governance</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Evaluated with perfect marks for public accountability and fund tracking.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">Freedom of Information (FOI)</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Official documents available for citizen review with zero redactions on budgets.</p>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search documents by title, resolution number, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
            >
              <option value="All">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
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

      {/* Documents List */}
      <div className="space-y-3">
        {filtered.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-[#0F2C59] dark:text-amber-400">{doc.category}</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="font-mono text-slate-400 dark:text-slate-500 text-[11px]">{doc.publishedDate}</span>
                  {doc.resolutionNumber && (
                    <>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold">
                        {doc.resolutionNumber}
                      </span>
                    </>
                  )}
                </div>

                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                  {doc.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {doc.description}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
              <span className="text-xs font-mono text-slate-400 dark:text-slate-500 mr-2">{doc.fileSize}</span>
              <button
                onClick={() => onPreviewDoc(doc)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>
              <button
                onClick={() => onPreviewDoc(doc)}
                className="px-3.5 py-1.5 rounded-lg bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
