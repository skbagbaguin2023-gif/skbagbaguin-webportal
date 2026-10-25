import React, { useState } from 'react';
import { Program, ProgramCategory, ProgramStatus } from '../../types/index.ts';
import { formatCurrencyPHP } from '../../utils/portalLogic.ts';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Sliders, 
  FolderKanban, 
  X, 
  Save,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal.tsx';

interface ProgramsManagerProps {
  programs: Program[];
  onAddProgram: (prog: Program) => void;
  onUpdateProgram: (prog: Program) => void;
  onDeleteProgram: (id: string) => void;
}

export const ProgramsManager: React.FC<ProgramsManagerProps> = ({
  programs,
  onAddProgram,
  onUpdateProgram,
  onDeleteProgram,
}) => {
  const [search, setSearch] = useState('');
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  // New program state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ProgramCategory>('Education');
  const [formSummary, setFormSummary] = useState('');
  const [formBudget, setFormBudget] = useState<number | ''>('');
  const [formBeneficiaries, setFormBeneficiaries] = useState('');
  const [formLead, setFormLead] = useState('');
  const [formStatus, setFormStatus] = useState<ProgramStatus>('Upcoming');
  const [formProgress, setFormProgress] = useState(0);
  const [formTimeline, setFormTimeline] = useState('');

  const categories: ProgramCategory[] = ['Education', 'Sports', 'Livelihood', 'Environment', 'Health', 'Leadership'];
  const statuses: ProgramStatus[] = ['Upcoming', 'Ongoing', 'Completed'];

  const filtered = programs.filter(
    (p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.leadCouncilor.toLowerCase().includes(search.toLowerCase())
  );

  const totalAllocated = programs.reduce((sum, p) => sum + p.allocatedBudget, 0);

  const handleOpenCreate = () => {
    setEditingProgram(null);
    setFormTitle('');
    setFormCategory('Education');
    setFormSummary('');
    setFormBudget('');
    setFormBeneficiaries('');
    setFormLead('');
    setFormStatus('Upcoming');
    setFormProgress(0);
    setFormTimeline('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Program) => {
    setEditingProgram(p);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormSummary(p.summary);
    setFormBudget(p.allocatedBudget);
    setFormBeneficiaries(p.targetBeneficiaries);
    setFormLead(p.leadCouncilor);
    setFormStatus(p.status);
    setFormProgress(p.progressPercent);
    setFormTimeline(p.timeline);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProgram) {
      onUpdateProgram({
        ...editingProgram,
        title: formTitle,
        category: formCategory,
        summary: formSummary,
        allocatedBudget: Number(formBudget),
        targetBeneficiaries: formBeneficiaries,
        leadCouncilor: formLead,
        status: formStatus,
        progressPercent: Number(formProgress),
        timeline: formTimeline,
      });
    } else {
      const newProg: Program = {
        id: `prog-${Date.now()}`,
        title: formTitle,
        category: formCategory,
        summary: formSummary,
        allocatedBudget: Number(formBudget),
        targetBeneficiaries: formBeneficiaries,
        leadCouncilor: formLead,
        status: formStatus,
        progressPercent: Number(formProgress),
        timeline: formTimeline,
        imageUrl: '',
        objectives: [],
      };
      onAddProgram(newProg);
    }
    setIsModalOpen(false);
  };

  const handleQuickProgressUpdate = (prog: Program, newPct: number) => {
    onUpdateProgram({
      ...prog,
      progressPercent: Math.min(100, Math.max(0, newPct)),
      status: newPct === 100 ? 'Completed' : prog.status === 'Completed' ? 'Ongoing' : prog.status,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Budget Snapshot */}
      <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Programs & Projects Manager</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total Fund Allocated: <strong className="font-mono text-slate-800 dark:text-slate-200">{formatCurrencyPHP(totalAllocated)}</strong> under ABYIP 2026
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>New Project</span>
        </button>
      </Reveal>

      {/* Search */}
      <Reveal className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
          />
        </div>
      </Reveal>

      {/* Program Management Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((prog, index) => (
          <Reveal
            key={prog.id}
            delay={index * 100}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-[#0F2C59] dark:text-amber-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {prog.category}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                  prog.status === 'Ongoing' 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' 
                    : prog.status === 'Upcoming' 
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {prog.status}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                {prog.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {prog.summary}
              </p>

              {/* Budget and lead info */}
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 mt-3">
                <div>
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500">Budget</span>
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">{formatCurrencyPHP(prog.allocatedBudget)}</strong>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500">Lead Councilor</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate block">{prog.leadCouncilor}</span>
                </div>
              </div>

              {/* Progress Slider */}
              <div className="space-y-1.5 pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Progress Control:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{prog.progressPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={prog.progressPercent}
                  onChange={(e) => handleQuickProgressUpdate(prog, Number(e.target.value))}
                  className="w-full accent-[#0F2C59] dark:accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400 dark:text-slate-500 text-[11px]">Timeline: {prog.timeline}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(prog)}
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-[#0F2C59] dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setProgramToDelete(prog)}
                  className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Program Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-xs sm:items-center">
          <div className="my-0 flex max-h-[calc(100dvh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:my-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex shrink-0 items-center justify-between bg-[#0F2C59] px-6 py-4 text-white">
              <h3 className="font-bold text-base">
                {editingProgram ? 'Edit Program Details' : 'Create New Youth Program'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="min-h-0 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProgramCategory)}
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
                    onChange={(e) => setFormStatus(e.target.value as ProgramStatus)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Allocated Budget (PHP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formBudget}
                    onChange={(e) => setFormBudget(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Progress Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formProgress}
                    onChange={(e) => setFormProgress(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Lead Councilor *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLead}
                    onChange={(e) => setFormLead(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Implementation Timeline
                  </label>
                  <input
                    type="text"
                    value={formTimeline}
                    onChange={(e) => setFormTimeline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Target Beneficiaries
                </label>
                <input
                  type="text"
                  value={formBeneficiaries}
                  onChange={(e) => setFormBeneficiaries(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Program Summary & Objectives *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
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
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={programToDelete !== null}
        title="Delete this project?"
        message={programToDelete ? `Delete project "${programToDelete.title}"?` : ''}
        confirmLabel="Delete Project"
        onConfirm={() => {
          if (programToDelete) onDeleteProgram(programToDelete.id);
          setProgramToDelete(null);
        }}
        onCancel={() => setProgramToDelete(null)}
      />
    </div>
  );
};
