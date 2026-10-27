import React, { useState } from 'react';
import { FacebookPost } from '../../types/index.ts';
import { deletePortalImage, uploadPortalImage } from '../../services/supabaseData.ts';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal.tsx';
import { PortalImage } from '../../components/PortalImage.tsx';
import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';

interface FacebookPostsManagerProps {
  posts: FacebookPost[];
  onAdd: (post: FacebookPost) => Promise<void>;
  onUpdate: (post: FacebookPost) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const emptyForm = { title: '', excerpt: '', date: '', imageUrl: '', postUrl: '' };

export const FacebookPostsManager: React.FC<FacebookPostsManagerProps> = ({ posts, onAdd, onUpdate, onDelete }) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FacebookPost | null>(null);

  const reset = () => {
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
    setSelectedImage(null);
    setPreviewUrl('');
    setError('');
  };

  const openEdit = (post: FacebookPost) => {
    setEditingId(post.id);
    setForm({ title: post.title, excerpt: post.excerpt, date: post.date, imageUrl: post.imageUrl, postUrl: post.postUrl });
    setSelectedImage(null);
    setPreviewUrl('');
    setError('');
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.postUrl.trim() || (!form.imageUrl && !selectedImage)) {
      setError('Title, Facebook post URL, and an image are required.');
      return;
    }
    setIsSaving(true);
    let uploadedUrl = '';
    try {
      const imageUrl = selectedImage
        ? await uploadPortalImage(selectedImage, 'announcements').then((url) => {
            uploadedUrl = url;
            return url;
          })
        : form.imageUrl;
      const post: FacebookPost = {
        id: editingId ?? `facebook-${Date.now()}`,
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        date: form.date,
        imageUrl,
        postUrl: form.postUrl.trim(),
      };
      if (editingId) await onUpdate(post);
      else await onAdd(post);
      reset();
    } catch (saveError) {
      if (uploadedUrl) await deletePortalImage(uploadedUrl).catch(() => undefined);
      setError(saveError instanceof Error ? saveError.message : 'Could not save this Facebook post.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await onDelete(deleteTarget.id);
    if (deleteTarget.imageUrl) await deletePortalImage(deleteTarget.imageUrl).catch(() => undefined);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Latest from Facebook</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage the Facebook posts shown on the public Home page.</p>
        </div>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2C59] px-3 py-2 text-xs font-semibold text-white">
          <Plus className="h-4 w-4" /> Add Post
        </button>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-3 md:grid-cols-2">
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Post title" className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <input required type="url" value={form.postUrl} onChange={(e) => setForm({ ...form, postUrl: e.target.value })} placeholder="Facebook post URL" className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setSelectedImage(file); setPreviewUrl(URL.createObjectURL(file)); } }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short description" rows={3} className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </div>
        {(previewUrl || form.imageUrl) && <PortalImage src={previewUrl || form.imageUrl} alt="Facebook post preview" className="mt-3 h-32 w-full rounded-lg object-cover" />}
        {error && <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          {editingId && <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:text-white"><X className="h-4 w-4" /> Cancel</button>}
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-1 rounded-lg bg-[#0F2C59] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Post'}</button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => (
          <article key={post.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <PortalImage src={post.imageUrl} alt="" className="h-40 w-full object-cover" />
            <div className="p-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{post.title}</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{post.date}</p>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => openEdit(post)} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:text-white"><Edit3 className="h-3.5 w-3.5" /> Edit</button>
                <button type="button" onClick={() => setDeleteTarget(post)} className="inline-flex items-center gap-1 rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Facebook post?"
        message="This post will be removed from the public Home page."
        confirmLabel="Delete Post"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
