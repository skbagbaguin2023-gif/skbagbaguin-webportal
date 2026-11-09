import { ArrowLeft, CheckCircle2, FileText, Target, User } from 'lucide-react';
import type { Program } from '../../types/index.ts';
import Reveal from '../../components/Reveal.jsx';
import { PortalImage } from '../../components/PortalImage.tsx';

const formatBudgetAmount = (amount: number): string =>
  `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface ProgramDetailViewProps {
  program: Program;
  onBack: () => void;
}

export function ProgramDetailView({ program, onBack }: ProgramDetailViewProps) {
  const objectives = Array.isArray(program.objectives) ? program.objectives : [];
  const allocatedBudget = Number.isFinite(program.allocatedBudget) ? program.allocatedBudget : 0;
  const spentBudget = Number.isFinite(program.spentBudget) ? (program.spentBudget ?? 0) : 0;
  const remainingBudget = allocatedBudget - spentBudget;
  const utilizationRate = allocatedBudget > 0 ? (spentBudget / allocatedBudget) * 100 : null;
  const utilizationWidth = Math.min(Math.max(utilizationRate ?? 0, 0), 100);
  const isOverBudget = remainingBudget < 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-[#0F2C59] transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 dark:text-amber-300 dark:hover:bg-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </button>

      <Reveal className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative h-56 bg-[#0F2C59] sm:h-80">
          <PortalImage src={program.imageUrl} alt={program.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081830]/90 via-[#081830]/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-amber-400 px-3 py-1 text-[#081830]">{program.category}</span>
              <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-white backdrop-blur-sm">{program.status}</span>
            </div>
            <h1 className="max-w-3xl text-2xl font-extrabold leading-tight text-white sm:text-4xl">{program.title}</h1>
          </div>
        </div>

        <div className="space-y-7 p-5 sm:p-8">
          <section aria-label="Project overview" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: 'Implementation', value: `${program.progressPercent}%` },
              { label: 'Target Beneficiaries', value: program.targetBeneficiaries },
              { label: 'Timeline', value: program.timeline },
            ].map((item) => (
              <div key={item.label} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
                <strong className="mt-1 block break-words text-sm font-bold text-slate-900 dark:text-white">{item.value}</strong>
              </div>
            ))}
          </section>

          <section aria-labelledby="budget-utilization-heading" className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:p-5">
            <div className="mb-4">
              <h2 id="budget-utilization-heading" className="text-base font-bold text-slate-900 dark:text-white">
                Budget Utilization
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Latest budget figures provided for this program.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Allocated', value: allocatedBudget, color: 'text-[#0F2C59] dark:text-amber-300' },
                { label: 'Spent / Disbursed', value: spentBudget, color: 'text-indigo-600 dark:text-indigo-300' },
                { label: isOverBudget ? 'Over Budget' : 'Remaining', value: remainingBudget, color: isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                  <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
                  <strong className={`mt-1 block break-words text-xl font-extrabold tabular-nums ${item.color}`}>
                    {formatBudgetAmount(item.value)}
                  </strong>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Utilization Rate</span>
                <strong className={isOverBudget ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}>
                  {utilizationRate === null ? 'Not allocated' : `${utilizationRate.toFixed(1)}%`}
                </strong>
              </div>
              <div
                role="progressbar"
                aria-label="Budget utilization"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={utilizationWidth}
                aria-valuetext={utilizationRate === null ? 'No budget allocated' : `${utilizationRate.toFixed(1)}% utilized`}
                className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
              >
                <div
                  className={`h-full rounded-full transition-[width] ${isOverBudget ? 'bg-rose-500' : 'bg-amber-400'}`}
                  style={{ width: `${utilizationWidth}%` }}
                />
              </div>
            </div>
          </section>

          {(program.summary.trim() || objectives.length > 0) && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Target className="h-5 w-5 text-[#0F2C59] dark:text-amber-400" />
                Program Summary & Objectives
              </h2>
              {program.summary.trim() && (
                <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
                  {program.summary}
                </p>
              )}
              {objectives.length > 0 && (
                <ul className="space-y-2">
                  {objectives.map((objective, index) => (
                    <li key={`${index}-${objective}`} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{objective}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {program.requirements && program.requirements.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <FileText className="h-5 w-5 text-[#0F2C59] dark:text-amber-400" />
                Eligibility & Requirements
              </h2>
              <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {program.requirements.map((requirement, index) => <li key={`${index}-${requirement}`}>{requirement}</li>)}
              </ul>
            </section>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-slate-200 pt-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <User className="h-4 w-4 text-[#0F2C59] dark:text-amber-400" />
            <span>Lead Councilor:</span>
            <strong className="text-slate-800 dark:text-slate-200">{program.leadCouncilor}</strong>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
