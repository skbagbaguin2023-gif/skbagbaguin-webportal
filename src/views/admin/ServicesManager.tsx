import React, { useState } from 'react';
import { Check, Edit3, FileText, Plus, Printer, Trash2, UserCheck, X } from 'lucide-react';
import type { YouthService } from '../../types/index.ts';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal.tsx';
import { generateUuid } from '../../utils/uuid.ts';

interface ServicesManagerProps {
  services: YouthService[];
  onAddService: (service: YouthService) => void;
  onUpdateService: (service: YouthService) => void;
  onDeleteService: (id: string) => void;
}

const emptyForm = (): Omit<YouthService, 'id'> => ({
  name: '',
  tagline: '',
  description: '',
  turnaroundTime: '',
  eligibility: [],
  requirements: [],
  isActive: true,
});

export const ServicesManager: React.FC<ServicesManagerProps> = ({
  services,
  onAddService,
  onUpdateService,
  onDeleteService,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<YouthService, 'id'>>(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<YouthService | null>(null);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openEditForm = (service: YouthService) => {
    const { id: _id, ...values } = service;
    setEditingId(service.id);
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
    const normalized = {
      ...form,
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      turnaroundTime: form.turnaroundTime.trim(),
      eligibility: form.eligibility.filter((item) => item.trim()).map((item) => item.trim()),
      requirements: form.requirements.filter((item) => item.trim()).map((item) => item.trim()),
    };
    if (!normalized.name) return;

    if (editingId) {
      onUpdateService({ id: editingId, ...normalized });
    } else {
      onAddService({ id: generateUuid(), ...normalized });
    }
    closeForm();
  };

  const updateListField = (field: 'eligibility' | 'requirements', value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value.split('\n'),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Youth Services</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add, edit, publish, or remove the services displayed on the public portal.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0b2348]"
        >
          <Plus className="h-4 w-4 text-amber-400" />
          Add Service
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">
              {editingId ? 'Edit Service' : 'Add Service'}
            </h3>
            <button type="button" onClick={closeForm} aria-label="Close form">
              <X className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Service name *
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Tagline
              <input
                maxLength={160}
                value={form.tagline}
                onChange={(event) => setForm({ ...form, tagline: event.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>

          <label className="block space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Description
            <textarea
              rows={3}
              maxLength={2000}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <label className="block space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Processing time
            <input
              maxLength={120}
              value={form.turnaroundTime}
              onChange={(event) => setForm({ ...form, turnaroundTime: event.target.value })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Eligibility (one item per line)
              <textarea
                rows={4}
                value={form.eligibility.join('\n')}
                onChange={(event) => updateListField('eligibility', event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-700 dark:text-slate-300">
              Requirements (one item per line)
              <textarea
                rows={4}
                value={form.requirements.join('\n')}
                onChange={(event) => updateListField('requirements', event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              className="h-4 w-4 rounded"
            />
            Show this service on the public portal and application form
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeForm} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold dark:border-slate-700">
              Cancel
            </button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#0F2C59] px-4 py-2 text-xs font-semibold text-white">
              <Check className="h-4 w-4 text-amber-400" />
              Save Service
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {services.map((service) => {
          const Icon = service.name.toLowerCase().includes('print') ? Printer
            : service.name.toLowerCase().includes('profil') ? UserCheck : FileText;
          return (
            <article key={service.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Icon className="mt-1 h-5 w-5 shrink-0 text-[#0F2C59] dark:text-amber-400" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{service.name}</h3>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${service.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {service.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => openEditForm(service)} aria-label={`Edit ${service.name}`} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setServiceToDelete(service)}
                    aria-label={`Delete ${service.name}`}
                    className="rounded-md p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {service.tagline && <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">{service.tagline}</p>}
              {service.description && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{service.description}</p>}
            </article>
          );
        })}
        {services.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 md:col-span-2">
            No services yet. Add your first service to display it on the public portal.
          </p>
        )}
      </div>
      <ConfirmationModal
        isOpen={serviceToDelete !== null}
        title="Delete this service?"
        message={serviceToDelete
          ? `Delete "${serviceToDelete.name}"? This removes it from the public service list.`
          : ''}
        confirmLabel="Delete Service"
        onConfirm={() => {
          if (serviceToDelete) onDeleteService(serviceToDelete.id);
          setServiceToDelete(null);
        }}
        onCancel={() => setServiceToDelete(null)}
      />
    </div>
  );
};
