import React, { useState } from 'react';
import { CouncilMember } from '../../types/index.ts';
import { Mail, Phone, Edit, Trash2, Plus, Save, X, Upload, GripVertical } from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';

interface CouncilManagerProps {
  council: CouncilMember[];
  onAddCouncilMember: (member: CouncilMember) => void;
  onUpdateCouncilMember: (member: CouncilMember) => void;
  onDeleteCouncilMember: (id: string) => void;
  onReorderCouncil: (council: CouncilMember[]) => void;
}

type CouncilMemberForm = Omit<CouncilMember, 'id'>;
const councilPositions = ['SK Chairperson', 'SK Member', 'SK Secretary', 'SK Treasurer'];
const getInitials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

const emptyForm: CouncilMemberForm = {
  name: '',
  position: '',
  committee: '',
  term: '',
  bio: '',
  imageUrl: '',
  email: '',
  contact: '',
  motto: '',
};

export const CouncilManager: React.FC<CouncilManagerProps> = ({
  council,
  onAddCouncilMember,
  onUpdateCouncilMember,
  onDeleteCouncilMember,
  onReorderCouncil,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouncilMemberForm>(emptyForm);
  const [positionChoice, setPositionChoice] = useState('');
  const [customPosition, setCustomPosition] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const handleDrop = (targetId: string, sourceId: string) => {
    const sourceIndex = council.findIndex((member) => member.id === sourceId);
    const targetIndex = council.findIndex((member) => member.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

    const reorderedCouncil = [...council];
    const [movedMember] = reorderedCouncil.splice(sourceIndex, 1);
    reorderedCouncil.splice(targetIndex, 0, movedMember);
    onReorderCouncil(reorderedCouncil);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setPositionChoice('');
    setCustomPosition('');
    setErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (member: CouncilMember) => {
    const { id: memberId, ...memberForm } = member;
    setEditingId(memberId);
    setForm(memberForm);
    const isStandardPosition = councilPositions.includes(member.position);
    setPositionChoice(isStandardPosition ? member.position : 'Other');
    setCustomPosition(isStandardPosition ? '' : member.position);
    setErrors({});
    setIsFormOpen(true);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, imageUrl: 'Choose an image file.' }));
      return;
    }
    if (file.size >= 20 * 1024 * 1024) {
      setErrors((current) => ({ ...current, imageUrl: 'Image must be 20 MB or smaller.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, imageUrl: String(reader.result ?? '') }));
      setErrors((current) => ({ ...current, imageUrl: '' }));
    };
    reader.onerror = () => {
      setErrors((current) => ({ ...current, imageUrl: 'Could not read this image.' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) nextErrors.name = 'Enter the official’s name.';
    if (!form.position.trim()) nextErrors.position = 'Enter an official position.';
    if (!form.committee.trim()) nextErrors.committee = 'Enter a committee assignment.';
    if (!form.term.trim()) nextErrors.term = 'Enter the term of office.';
    if (!form.imageUrl && !editingId) nextErrors.imageUrl = 'Upload an official photo.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const member = {
      ...form,
      name: form.name.trim(),
      position: form.position.trim(),
      committee: form.committee.trim(),
      term: form.term.trim(),
      bio: form.bio.trim(),
      email: form.email.trim(),
      contact: form.contact.trim(),
      motto: form.motto.trim(),
    };

    if (editingId) {
      onUpdateCouncilMember({ ...member, id: editingId });
    } else {
      onAddCouncilMember({ ...member, id: `council-${Date.now()}` });
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">SK Council Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Council profiles published on the public website</p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Add Council Member</span>
        </button>
      </Reveal>

      {isFormOpen && (
        <Reveal as="form" onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {editingId ? 'Edit Council Member' : 'New Council Member'}
            </h3>
            <button type="button" onClick={() => setIsFormOpen(false)} aria-label="Close form" className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Official Name *
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" />
              {errors.name && <span className="block mt-1 text-rose-600">{errors.name}</span>}
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Position *
              <select
                value={positionChoice}
                onChange={(e) => {
                  const choice = e.target.value;
                  setPositionChoice(choice);
                  if (choice !== 'Other') setForm({ ...form, position: choice });
                }}
                className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
              >
                <option value="">Select a position</option>
                {councilPositions.map((position) => <option key={position} value={position}>{position}</option>)}
                <option value="Other">Other</option>
              </select>
              {positionChoice === 'Other' && (
                <input
                  value={customPosition}
                  onChange={(e) => {
                    setCustomPosition(e.target.value);
                    setForm({ ...form, position: e.target.value });
                  }}
                  placeholder="Enter position"
                  className="mt-2 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                />
              )}
              {errors.position && <span className="block mt-1 text-rose-600">{errors.position}</span>}
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Committee *
              <input value={form.committee} onChange={(e) => setForm({ ...form, committee: e.target.value })} className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" />
              {errors.committee && <span className="block mt-1 text-rose-600">{errors.committee}</span>}
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Term *
              <input value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" />
              {errors.term && <span className="block mt-1 text-rose-600">{errors.term}</span>}
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Email
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" />
              {errors.email && <span className="block mt-1 text-rose-600">{errors.email}</span>}
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Contact Number
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" />
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 md:col-span-2">
              Biography
              <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" />
            </label>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Motto
              <input value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })} className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800" />
            </label>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Official Photo *
              <label className="mt-1 flex items-center gap-2 w-fit px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800">
                <Upload className="w-4 h-4" />
                <span>Choose image</span>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
              </label>
              <span className="block mt-1 text-[11px] text-slate-500">Image files up to 10 MB</span>
              {errors.imageUrl && <span className="block mt-1 text-rose-600">{errors.imageUrl}</span>}
              {form.imageUrl && <img src={form.imageUrl} alt="Selected council member" className="mt-2 w-16 h-16 rounded-full object-cover" />}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer">Cancel</button>
            <button type="submit" className="px-3 py-2 text-xs font-semibold bg-[#0F2C59] text-white rounded-lg flex items-center gap-1.5 cursor-pointer">
              <Save className="w-4 h-4" /> {editingId ? 'Save Changes' : 'Validate & Publish'}
            </button>
          </div>
        </Reveal>
      )}

      {council.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          No council profiles have been added yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {council.map((member, index) => (
            <Reveal
              key={member.id}
              delay={index * 100}
              onDragOver={(event: React.DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setDropTargetId(member.id);
              }}
              onDragLeave={() => setDropTargetId(null)}
              onDrop={(event: React.DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData('text/plain');
                if (sourceId) handleDrop(member.id, sourceId);
                setDropTargetId(null);
              }}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-xs flex flex-col justify-between space-y-4 ${dropTargetId === member.id ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200 dark:border-slate-800'}`}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-amber-400 shrink-0">
                        {member.imageUrl ? (
                          <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#0F2C59] text-amber-400 font-bold">{getInitials(member.name)}</div>
                        )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{member.name}</h3>
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block">{member.position}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">Term: {member.term}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    draggable
                    aria-label={`Drag ${member.name} to reorder`}
                    title="Drag to change card order"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', member.id);
                    }}
                    onDragEnd={() => setDropTargetId(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing touch-none"
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <span className="font-semibold block text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">Committee Assignment</span>
                  <span className="font-medium">{member.committee}</span>
                </div>
                {member.bio && <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">{member.bio}</p>}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                {member.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /><span className="truncate">{member.email}</span></div>}
                {member.contact && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /><span>{member.contact}</span></div>}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => openEditForm(member)} className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md flex items-center gap-1 cursor-pointer"><Edit className="w-3.5 h-3.5" /> Edit</button>
                  <button type="button" onClick={() => onDeleteCouncilMember(member.id)} className="px-2.5 py-1.5 border border-rose-300 text-rose-700 dark:text-rose-300 dark:border-rose-900 rounded-md flex items-center gap-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
};
