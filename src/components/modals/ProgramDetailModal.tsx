import React from 'react';
import { Program } from '../../types/index.ts';
import { formatCurrencyPHP } from '../../utils/portalLogic.ts';
import { X, Target, Calendar, User, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { PortalImage } from '../PortalImage.tsx';

interface ProgramDetailModalProps {
  program: Program | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (programTitle: string) => void;
}

export const ProgramDetailModal: React.FC<ProgramDetailModalProps> = ({
  program,
  isOpen,
  onClose,
  onApply,
}) => {
  if (!isOpen || !program) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Cover */}
        <div className="relative h-48 bg-[#0F2C59] overflow-hidden">
          <PortalImage
            src={program.imageUrl}
            alt={program.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081830] via-navy-950/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
              <span>{program.category}</span>
              <span>·</span>
              <span className="text-white bg-white/20 px-2 py-0.5 rounded text-[11px] font-medium">
                {program.status}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">
              {program.title}
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          
          {/* Summary */}
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {program.summary}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Allocated Budget</span>
              <strong className="text-slate-900 dark:text-white font-mono text-sm">
                {formatCurrencyPHP(program.allocatedBudget)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Progress</span>
              <strong className="text-slate-900 dark:text-white font-mono text-sm">{program.progressPercent}%</strong>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Beneficiaries</span>
              <strong className="text-slate-900 dark:text-white truncate block">{program.targetBeneficiaries}</strong>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Timeline</span>
              <strong className="text-slate-900 dark:text-white block truncate">{program.timeline}</strong>
            </div>
          </div>

          {/* Objectives */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
              <Target className="w-4 h-4 text-[#0F2C59] dark:text-amber-400" />
              <span>Program Objectives & Community Impact</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {program.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements & Guidelines */}
          {program.requirements && program.requirements.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                <FileText className="w-4 h-4 text-[#0F2C59] dark:text-amber-400" />
                <span>Eligibility & Requirements</span>
              </h3>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                {program.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Lead Committee */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#0F2C59] dark:text-amber-400" />
              <span>Lead Councilor: <strong className="text-slate-800 dark:text-slate-200">{program.leadCouncilor}</strong></span>
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
              Valenzuela Youth Ordinance No. 2026
            </span>
          </div>

          {/* Action */}
          <div className="pt-3 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onApply(program.title);
              }}
              className="bg-[#F5A623] hover:bg-[#D98E16] text-[#081830] font-bold px-5 py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>Apply for this Program</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
