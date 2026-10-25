import React, { useEffect, useState } from 'react';
import { CouncilMember } from '../../types/index.ts';
import { Mail, Phone, Edit, Trash2, Plus, Save, X, Upload, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';
import { deletePortalImage, uploadPortalImage } from '../../services/supabaseData.ts';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal.tsx';
import { CouncilMemberAvatar } from '../../components/CouncilMemberAvatar.tsx';

interface CouncilManagerProps {
  council: CouncilMember[];
  onAddCouncilMember: (member: CouncilMember) => Promise<void>;
  onUpdateCouncilMember: (member: CouncilMember) => Promise<void>;
  onDeleteCouncilMember: (id: string) => void;
  onReorderCouncil: (council: CouncilMember[]) => Promise<void>;
}

type CouncilMemberForm = Omit<CouncilMember, 'id'>;
const councilPositions = ['SK Chairperson', 'SK Member', 'SK Secretary', 'SK Treasurer'];
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
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState('');
  const [isReordering, setIsReordering] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<CouncilMember | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  const handleDrop = async (targetId: string, sourceId: string): Promise<void> => {
    const sourceIndex = council.findIndex((member) => member.id === sourceId);
    const targetIndex = council.findIndex((member) => member.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;

    const reorderedCouncil = [...council];
    const [movedMember] = reorderedCouncil.splice(sourceIndex, 1);
    reorderedCouncil.splice(targetIndex, 0, movedMember);
    setReorderError('');
    setIsReordering(true);
    try {
      await onReorderCouncil(reorderedCouncil);
    } catch (error) {
      setReorderError(error instanceof Error ? error.message : 'Could not save council member order. Please try again.');
    } finally {
      setIsReordering(false);
    }
  };

  const moveMember = (memberId: string, offset: -1 | 1) => {
    const sourceIndex = council.findIndex((member) => member.id === memberId);
    const targetIndex = sourceIndex + offset;
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= council.length) return;
    void handleDrop(council[targetIndex].id, memberId);
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setSelectedPhoto(null);
    setPhotoPreviewUrl('');
    setPositionChoice('');
    setCustomPosition('');
    setErrors({});
    setIsFormOpen(true);
  };

  const openEditForm = (member: CouncilMember) => {
    const { id: memberId, ...memberForm } = member;
    setEditingId(memberId);
    setForm(memberForm);
    setSelectedPhoto(null);
    setPhotoPreviewUrl('');
    const isStandardPosition = councilPositions.includes(member.position);
    setPositionChoice(isStandardPosition ? member.position : 'Other');
    setCustomPosition(isStandardPosition ? '' : member.position);
    setErrors({});
    setIsFormOpen(true);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrors((current) => ({ ...current, imageUrl: 'Choose a JPG, PNG, or WebP image.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((current) => ({ ...current, imageUrl: 'Image must be 5 MB or smaller.' }));
      return;
    }

    setSelectedPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setErrors((current) => ({ ...current, imageUrl: '' }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
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

    setIsSaving(true);
    let uploadedImageUrl: string | undefined;
    let profileSaved = false;
    const existingImageUrl = editingId ? council.find((item) => item.id === editingId)?.imageUrl : undefined;
    try {
      let imageUrl = form.imageUrl;
      if (selectedPhoto) {
        imageUrl = await uploadPortalImage(selectedPhoto, 'council');
        uploadedImageUrl = imageUrl;
      }
      const member = {
        ...form,
        imageUrl,
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
        await onUpdateCouncilMember({ ...member, id: editingId });
      } else {
        await onAddCouncilMember({ ...member, id: `council-${Date.now()}` });
      }
      profileSaved = true;
      setIsFormOpen(false);
      if (uploadedImageUrl && existingImageUrl && existingImageUrl !== uploadedImageUrl) {
        try {
          await deletePortalImage(existingImageUrl);
        } catch (cleanupError) {
          console.error('Unable to remove the replaced council image.', cleanupError);
        }
      }
    } catch (error) {
      if (uploadedImageUrl && !profileSaved) {
        try {
          await deletePortalImage(uploadedImageUrl);
        } catch (cleanupError) {
          console.error('Unable to remove an unlinked council image.', cleanupError);
        }
      }
      setErrors((current) => ({
        ...current,
        imageUrl: error instanceof Error ? error.message : 'Could not save this council profile.',
      }));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">SK Council Directory</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Council profiles published on the public website. Drag the grip or use the arrow buttons to reorder cards.</p>
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
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="sr-only" />
              </label>
              <span className="block mt-1 text-[11px] text-slate-500">JPG, PNG, or WebP up to 5 MB</span>
              {errors.imageUrl && <span className="block mt-1 text-rose-600">{errors.imageUrl}</span>}
              {photoPreviewUrl ? (
                <img src={photoPreviewUrl} alt="Selected council member" className="mt-2 w-16 h-16 rounded-full object-cover" />
              ) : form.imageUrl ? (
                <CouncilMemberAvatar
                  member={{ id: editingId ?? '', name: form.name, imageUrl: form.imageUrl }}
                  className="mt-2 h-16 w-16 rounded-full bg-[#0F2C59]"
                />
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setIsFormOpen(false)} className="px-3 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer">Cancel</button>
            <button type="submit" disabled={isSaving} className="px-3 py-2 text-xs font-semibold bg-[#0F2C59] text-white rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-60">
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Validate & Publish'}
            </button>
          </div>
        </Reveal>
      )}

      {council.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          No council profiles have been added yet.
        </div>
      ) : (
        <>
        {reorderError && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            {reorderError}
          </p>
        )}
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
              onDragLeave={(event: React.DragEvent<HTMLDivElement>) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropTargetId(null);
              }}
              onDrop={(event: React.DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData('text/plain') || draggedMemberId;
                if (sourceId) void handleDrop(member.id, sourceId);
                setDraggedMemberId(null);
                setDropTargetId(null);
              }}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-5 shadow-xs flex flex-col justify-between space-y-4 ${dropTargetId === member.id ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200 dark:border-slate-800'}`}
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-amber-400 shrink-0">
                      <CouncilMemberAvatar member={member} className="h-full w-full bg-[#0F2C59]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{member.name}</h3>
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 block">{member.position}</span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">Term: {member.term}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    draggable={!isReordering}
                    aria-label={`Drag ${member.name} to reorder`}
                    title="Drag to change card order"
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = 'move';
                      event.dataTransfer.setData('text/plain', member.id);
                      setDraggedMemberId(member.id);
                    }}
                    onDragEnd={() => {
                      setDraggedMemberId(null);
                      setDropTargetId(null);
                    }}
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
                <div className="flex items-center justify-between gap-2 pt-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveMember(member.id, -1)}
                      disabled={index === 0 || isReordering}
                      aria-label={`Move ${member.name} up`}
                      title="Move card up"
                      className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveMember(member.id, 1)}
                      disabled={index === council.length - 1 || isReordering}
                      aria-label={`Move ${member.name} down`}
                      title="Move card down"
                      className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => openEditForm(member)} className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-md flex items-center gap-1 cursor-pointer"><Edit className="w-3.5 h-3.5" /> Edit</button>
                  <button type="button" onClick={() => setMemberToDelete(member)} className="px-2.5 py-1.5 border border-rose-300 text-rose-700 dark:text-rose-300 dark:border-rose-900 rounded-md flex items-center gap-1 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Delete</button>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        </>
      )}

      <ConfirmationModal
        isOpen={memberToDelete !== null}
        title="Delete this council profile?"
        message={memberToDelete ? `Delete the profile for ${memberToDelete.name}?` : ''}
        confirmLabel="Delete Profile"
        onConfirm={() => {
          if (memberToDelete) onDeleteCouncilMember(memberToDelete.id);
          setMemberToDelete(null);
        }}
        onCancel={() => setMemberToDelete(null)}
      />
    </div>
  );
};
