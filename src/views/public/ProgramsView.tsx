import React, { useState } from 'react';
import { Program, ProgramCategory, ProgramFiscalYear, ProgramStatus } from '../../types/index.ts';
import { filterPrograms, formatCurrencyPHP } from '../../utils/portalLogic.ts';
import { Search, Filter, Sparkles, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';
import { PortalImage } from '../../components/PortalImage.tsx';

interface ProgramsViewProps {
  programs: Program[];
  fiscalYears: ProgramFiscalYear[];
  onSelectProgram: (prog: Program) => void;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({
  programs,
  fiscalYears,
  onSelectProgram,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProgramCategory>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | ProgramStatus>('All');
  const defaultYear = new Date().getFullYear();
  const availableYears = Array.from(new Set([
    ...fiscalYears.map((item) => item.year),
    ...programs.map((program) => program.fiscalYear ?? defaultYear),
    defaultYear,
  ])).sort((a, b) => b - a);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const yearSettings = fiscalYears.find((item) => item.year === selectedYear);
  const yearPrograms = programs.filter((program) => (program.fiscalYear ?? defaultYear) === selectedYear);

  const filtered = filterPrograms(yearPrograms, searchQuery, selectedCategory, selectedStatus);
  const categories: ProgramCategory[] = ['All', 'Education', 'Sports', 'Livelihood', 'Environment', 'Health', 'Leadership'];
  const statuses: ('All' | ProgramStatus)[] = ['All', 'Ongoing', 'Upcoming', 'Completed'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header Banner */}
      <Reveal className="bg-[#0F2C59] text-white rounded-2xl p-6 sm:p-10 border border-navy-800 shadow-md">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-white/10 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official SK Bagbaguin Youth Programs</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Projects, Programs and Activities
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            Complete overview of SK Barangay Bagbaguin projects, programs, activities, and budget utilization by fiscal year.
          </p>
        </div>
      </Reveal>

      <section className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 dark:text-white">Select a Fiscal Year</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {availableYears.map((year) => {
            const settings = fiscalYears.find((item) => item.year === year);
            const count = programs.filter((program) => (program.fiscalYear ?? defaultYear) === year).length;
            const funds = settings?.totalFunds ?? programs.filter((program) => (program.fiscalYear ?? defaultYear) === year).reduce((sum, program) => sum + program.allocatedBudget, 0);
            const disbursed = settings?.totalDisbursed ?? 0;
            const utilization = funds ? Math.min(100, Math.round((disbursed / funds) * 100)) : 0;
            return (
              <button key={year} type="button" onClick={() => setSelectedYear(year)} className={`rounded-2xl border p-5 text-left shadow-xs transition ${selectedYear === year ? 'border-[#1d4ed8] ring-2 ring-blue-100 dark:ring-blue-950' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-900`}>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-extrabold text-[#1d4ed8]">{year}</span>
                  {year === (fiscalYears.find((item) => item.isCurrent)?.year ?? defaultYear) && <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700">Current</span>}
                </div>
                <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex justify-between"><span>SK Total Funds</span><strong className="text-slate-800 dark:text-slate-200">{formatCurrencyPHP(funds)}</strong></div>
                  <div className="flex justify-between"><span>Total Disbursed</span><strong className="text-slate-800 dark:text-slate-200">{formatCurrencyPHP(disbursed)}</strong></div>
                  <div className="flex justify-between"><span>Projects, Programs and Activities</span><strong className="text-slate-800 dark:text-slate-200">{count}</strong></div>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[11px]"><span>Utilization</span><strong className="text-blue-600">{utilization}%</strong></div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-2 rounded-full bg-blue-600" style={{ width: `${utilization}%` }} /></div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {selectedYear !== null && <section className="space-y-6">
        <button type="button" onClick={() => setSelectedYear(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1d4ed8] hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> All Fiscal Years
        </button>
        <div className="rounded-2xl bg-gradient-to-r from-[#1d4ed8] to-[#2445b8] p-6 text-white shadow-md sm:p-8">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">Transparency</span>
          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><h2 className="text-3xl font-extrabold">Fiscal Year {selectedYear}</h2><p className="mt-1 text-sm text-blue-100">Projects, programs, activities, and budget utilization for SK Barangay Bagbaguin.</p></div>
            <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} className="rounded-lg border border-white/20 bg-blue-700 px-4 py-2 text-xs font-bold text-white">
              {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#1d4ed8] p-6 text-white"><span className="text-xs font-bold uppercase opacity-80">SK Total Funds</span><p className="mt-3 text-2xl font-extrabold">{formatCurrencyPHP(yearSettings?.totalFunds ?? yearPrograms.reduce((sum, program) => sum + program.allocatedBudget, 0))}</p></div>
        <div className="rounded-2xl bg-emerald-600 p-6 text-white"><span className="text-xs font-bold uppercase opacity-80">Total Disbursed</span><p className="mt-3 text-2xl font-extrabold">{formatCurrencyPHP(yearSettings?.totalDisbursed ?? 0)}</p></div>
        <div className="rounded-2xl bg-white p-6 shadow-xs border border-slate-200 dark:border-slate-800 dark:bg-slate-900"><span className="text-xs font-bold uppercase text-slate-500">Remaining Balance</span><p className="mt-3 text-2xl font-extrabold text-[#1d4ed8]">{formatCurrencyPHP((yearSettings?.totalFunds ?? 0) - (yearSettings?.totalDisbursed ?? 0))}</p></div>
      </section>

      {/* Filter & Search Bar */}
      <Reveal className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        {/* Top search & status row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search programs by name, keyword, or beneficiary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
            />
          </div>

          {/* Status Segmented Control */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg shrink-0">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2 hidden sm:inline">Status:</span>
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills (Functional filter buttons) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium">
          <span className="text-slate-400 dark:text-slate-500 font-semibold flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
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

      {/* Program Cards Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((prog, index) => (
            <Reveal
              key={prog.id}
              delay={index * 100}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Image Cover */}
                <div className="relative h-44 bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <PortalImage
                    src={prog.imageUrl}
                    alt={prog.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-[#0F2C59] text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs">
                    {prog.category}
                  </div>
                  <div className={`absolute top-3 right-3 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-xs ${
                    prog.status === 'Ongoing' ? 'bg-emerald-600' : prog.status === 'Upcoming' ? 'bg-amber-600' : 'bg-slate-600'
                  }`}>
                    {prog.status}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {prog.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {prog.summary}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500">Budget Allocated</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-mono text-xs">{formatCurrencyPHP(prog.allocatedBudget)}</strong>
                    </div>
                    <div>
                      <span className="block text-slate-400 dark:text-slate-500">Target Beneficiaries</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">{prog.targetBeneficiaries}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>Implementation</span>
                      <span className="font-mono text-slate-900 dark:text-white">{prog.progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#0F2C59] dark:bg-amber-400 h-full rounded-full"
                        style={{ width: `${prog.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-5 pt-0 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                <button
                  onClick={() => onSelectProgram(prog)}
                  className="text-xs font-semibold text-[#0F2C59] dark:text-amber-400 hover:underline py-2"
                >
                  View Details & Goals
                </button>
              </div>

            </Reveal>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
          <SlidersHorizontal className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No programs found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or reset the category/status filters to see all initiatives.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedStatus('All');
            }}
            className="text-xs font-semibold text-[#0F2C59] dark:text-amber-400 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
      </section>}

    </div>
  );
};
