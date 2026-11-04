import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import type {
  MaintenanceArea,
  MaintenanceIssue,
  MaintenanceSeverity,
  MaintenanceStatus,
} from '../../types/index.ts';
import { generateUuid } from '../../utils/uuid.ts';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal.tsx';

interface MaintenanceManagerProps {
  issues: MaintenanceIssue[];
  onAddIssue: (issue: MaintenanceIssue) => void;
  onUpdateIssue: (issue: MaintenanceIssue) => void;
  onDeleteIssue: (id: string) => void;
}

const areas: MaintenanceArea[] = ['Public Portal', 'Admin Dashboard', 'Supabase', 'Chatbot', 'Forms', 'Deployment', 'Other'];
const severities: MaintenanceSeverity[] = ['Low', 'Medium', 'High', 'Critical'];
const statuses: MaintenanceStatus[] = ['Open', 'Investigating', 'Resolved', 'Closed'];

const emptyForm = (): Omit<MaintenanceIssue, 'id' | 'createdAt' | 'updatedAt'> => ({
  title: '',
  description: '',
  area: 'Public Portal',
  severity: 'Medium',
  status: 'Open',
  stepsToReproduce: '',
  resolution: '',
  reportedBy: 'Portal Administrator',
});

const badgeClass: Record<MaintenanceSeverity, string> = {
  Low: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  High: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300',
  Critical: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
};

const statusClass: Record<MaintenanceStatus, string> = {
  Open: 'text-rose-700 dark:text-rose-300',
  Investigating: 'text-amber-700 dark:text-amber-300',
  Resolved: 'text-emerald-700 dark:text-emerald-300',
  Closed: 'text-slate-600 dark:text-slate-400',
};

export const MaintenanceManager: React.FC<MaintenanceManagerProps> = ({
  issues,
  onAddIssue,
  onUpdateIssue,
  onDeleteIssue,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | MaintenanceStatus>('All');
  const [severityFilter, setSeverityFilter] = useState<'All' | MaintenanceSeverity>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<MaintenanceIssue | null>(null);

  const filteredIssues = useMemo(() => {
    const query = search.trim().toLowerCase();
    return issues
      .filter((issue) => {
        const matchesQuery = !query
          || issue.title.toLowerCase().includes(query)
          || issue.description.toLowerCase().includes(query)
          || issue.area.toLowerCase().includes(query);
        return matchesQuery
          && (statusFilter === 'All' || issue.status === statusFilter)
          && (severityFilter === 'All' || issue.severity === severityFilter);
      })
      .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
  }, [issues, search, severityFilter, statusFilter]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEditForm = (issue: MaintenanceIssue) => {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...values } = issue;
    setEditingId(issue.id);
    setForm(values);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const now = new Date().toISOString();
    const normalized = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      stepsToReproduce: form.stepsToReproduce?.trim(),
      resolution: form.resolution?.trim(),
      reportedBy: form.reportedBy.trim() || 'Portal Administrator',
    };
    if (!normalized.title || !normalized.description) return;

    if (editingId) {
      const current = issues.find((issue) => issue.id === editingId);
      if (current) onUpdateIssue({ ...current, ...normalized, updatedAt: now });
    } else {
      onAddIssue({ id: generateUuid(), ...normalized, createdAt: now, updatedAt: now });
    }
    closeForm();
  };

  const activeCount = issues.filter((issue) => issue.status === 'Open' || issue.status === 'Investigating').length;
  const criticalCount = issues.filter((issue) => issue.severity === 'Critical' && issue.status !== 'Closed').length;
  const resolvedCount = issues.filter((issue) => issue.status === 'Resolved' || issue.status === 'Closed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">System Maintenance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Track portal bugs, backend incidents, and technical fixes for administrator follow-up.</p>
        </div>
        <button type="button" onClick={openCreateForm} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b2348]">
          <Plus className="h-4 w-4 text-amber-400" /> Log an Issue
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Active Issues', value: activeCount, icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
          { label: 'Critical Unresolved', value: criticalCount, icon: <AlertTriangle className="h-4 w-4 text-rose-500" /> },
          { label: 'Resolved / Closed', value: resolvedCount, icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p></div>
            {item.icon}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 border-b border-slate-200 p-3.5 dark:border-slate-800 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search issues..." className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | MaintenanceStatus)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="All">All statuses</option>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value as 'All' | MaintenanceSeverity)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">
            <option value="All">All severities</option>
            {severities.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </select>
        </div>

        {filteredIssues.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">
            <ClipboardList className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
            No maintenance issues match the current filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {filteredIssues.map((issue) => (
              <article key={issue.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{issue.title}</h3>
                    <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${badgeClass[issue.severity]}`}>{issue.severity}</span>
                    <span className={`text-[11px] font-bold ${statusClass[issue.status]}`}>{issue.status}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{issue.description}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{issue.area} · Reported by {issue.reportedBy} · Updated {new Date(issue.updatedAt).toLocaleString()}</p>
                  {issue.resolution && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"><strong>Resolution:</strong> {issue.resolution}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button type="button" onClick={() => openEditForm(issue)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><Edit3 className="h-3.5 w-3.5" /> Edit</button>
                  <button type="button" onClick={() => setIssueToDelete(issue)} className="rounded-lg border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/30" aria-label={`Delete ${issue.title}`}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-4">
          <form onSubmit={handleSubmit} className="my-8 max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div><h3 className="text-lg font-bold text-slate-900 dark:text-white">{editingId ? 'Edit Maintenance Issue' : 'Log Maintenance Issue'}</h3><p className="text-xs text-slate-500">Record enough detail for the next administrator to reproduce and resolve it.</p></div>
              <button type="button" onClick={closeForm} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <input required placeholder="Issue title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <textarea required rows={3} placeholder="What happened?" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <div className="grid gap-3 sm:grid-cols-3">
              <select value={form.area} onChange={(event) => setForm((current) => ({ ...current, area: event.target.value as MaintenanceArea }))} className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">{areas.map((area) => <option key={area}>{area}</option>)}</select>
              <select value={form.severity} onChange={(event) => setForm((current) => ({ ...current, severity: event.target.value as MaintenanceSeverity }))} className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">{severities.map((severity) => <option key={severity}>{severity}</option>)}</select>
              <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as MaintenanceStatus }))} className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">{statuses.map((status) => <option key={status}>{status}</option>)}</select>
            </div>
            <textarea rows={3} placeholder="Steps to reproduce (optional)" value={form.stepsToReproduce} onChange={(event) => setForm((current) => ({ ...current, stepsToReproduce: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <textarea rows={3} placeholder="Resolution or follow-up notes (optional)" value={form.resolution} onChange={(event) => setForm((current) => ({ ...current, resolution: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input placeholder="Reported by" value={form.reportedBy} onChange={(event) => setForm((current) => ({ ...current, reportedBy: event.target.value }))} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <div className="flex justify-end gap-2"><button type="button" onClick={closeForm} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold dark:border-slate-700 dark:text-slate-300">Cancel</button><button type="submit" className="rounded-lg bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white">Save Issue</button></div>
          </form>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!issueToDelete}
        title="Delete maintenance issue?"
        message={issueToDelete ? `This will permanently remove "${issueToDelete.title}" from the maintenance log.` : ''}
        confirmLabel="Delete"
        onConfirm={() => {
          if (issueToDelete) onDeleteIssue(issueToDelete.id);
          setIssueToDelete(null);
        }}
        onCancel={() => setIssueToDelete(null)}
      />
    </div>
  );
};
