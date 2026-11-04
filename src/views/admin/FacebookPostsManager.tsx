import React, { useState } from 'react';
import { FacebookPost } from '../../types/index.ts';
import { deletePortalImage, uploadPortalImage } from '../../services/supabaseData.ts';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal.tsx';
import { PortalImage } from '../../components/PortalImage.tsx';
import { ImageCropper } from '../../components/ImageCropper.tsx';
import { ChevronLeft, ChevronRight, Edit3, Plus, Save, Trash2, X } from 'lucide-react';

interface FacebookPostsManagerProps {
  posts: FacebookPost[];
  onAdd: (post: FacebookPost) => Promise<void>;
  onUpdate: (post: FacebookPost) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const emptyForm = { title: '', excerpt: '', date: '', imageUrl: '', postUrl: '' };
type ImageItem = { url: string; file?: File };

function getPostImages(post: FacebookPost): string[] {
  return post.imageUrls?.length ? post.imageUrls : post.imageUrl ? [post.imageUrl] : [];
}

function FacebookPostPreview({ post }: { post: FacebookPost }) {
  const [imageIndex, setImageIndex] = useState(0);
  const images = getPostImages(post);
  const activeImage = images[imageIndex % Math.max(images.length, 1)];

  return (
    <div className="relative isolate h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
      <PortalImage src={activeImage} alt={post.title} className="relative z-10 h-full w-full object-cover" />
      {images.length > 1 && (
        <>
          <button type="button" onClick={() => setImageIndex((current) => (current - 1 + images.length) % images.length)} aria-label={`Previous image for ${post.title}`} className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-slate-950/65 p-1.5 text-white hover:bg-slate-950/85">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setImageIndex((current) => (current + 1) % images.length)} aria-label={`Next image for ${post.title}`} className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full bg-slate-950/65 p-1.5 text-white hover:bg-slate-950/85">
            <ChevronRight className="h-4 w-4" />
          </button>
          <span className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-full bg-slate-950/65 px-2 py-1 text-[10px] font-semibold text-white">
            {imageIndex + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  );
}

export const FacebookPostsManager: React.FC<FacebookPostsManagerProps> = ({ posts, onAdd, onUpdate, onDelete }) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FacebookPost | null>(null);

  const reset = () => {
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
    setEditingId(null);
    setImageItems([]);
    setCropQueue([]);
    setCropFile(null);
    setError('');
  };

  const openEdit = (post: FacebookPost) => {
    setEditingId(post.id);
    setForm({ title: post.title, excerpt: post.excerpt, date: post.date, imageUrl: post.imageUrl, postUrl: post.postUrl });
    setImageItems(getPostImages(post).map((url) => ({ url })));
    setError('');
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= imageItems.length) return;
    setImageItems((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const removeImage = (index: number) => {
    setImageItems((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const startCropping = (files: File[]) => {
    const [first, ...remaining] = files;
    setCropFile(first ?? null);
    setCropQueue(remaining);
  };

  const handleCropComplete = (file: File) => {
    setImageItems((current) => [...current, { file, url: URL.createObjectURL(file) }]);
    const [next, ...remaining] = cropQueue;
    setCropFile(next ?? null);
    setCropQueue(remaining);
  };

  const cancelCropping = () => {
    setCropFile(null);
    setCropQueue([]);
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.postUrl.trim() || imageItems.length === 0) {
      setError('Title, Facebook post URL, and an image are required.');
      return;
    }
    setIsSaving(true);
    const uploadedUrls: string[] = [];
    try {
      const orderedImageUrls: string[] = [];
      for (const item of imageItems) {
        if (!item.file) {
          orderedImageUrls.push(item.url);
          continue;
        }
        const url = await uploadPortalImage(item.file, 'announcements');
        uploadedUrls.push(url);
        orderedImageUrls.push(url);
      }
      const post: FacebookPost = {
        id: editingId ?? `facebook-${Date.now()}`,
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        date: form.date,
        imageUrl: orderedImageUrls[0] ?? '',
        imageUrls: orderedImageUrls,
        postUrl: form.postUrl.trim(),
      };

      if (editingId) await onUpdate(post);
      else await onAdd(post);
      reset();
    } catch (saveError) {
      await Promise.all(uploadedUrls.map((url) => deletePortalImage(url).catch(() => undefined)));
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
          <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          startCropping(files);
          e.target.value = '';
          }} className="rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Short description" rows={3} className="md:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        </div>
        {imageItems.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {imageItems.map((item, index) => (
              <div key={`${item.url}-${index}`} className="relative rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                <PortalImage src={item.url} alt={`Facebook post image ${index + 1}`} className="h-24 w-full rounded-md object-contain" />
                <span className="absolute left-2 top-2 rounded bg-[#0F2C59] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {index === 0 ? 'First visible' : `Image ${index + 1}`}
                </span>
                <div className="mt-1 flex justify-center gap-1">
                  <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label={`Move image ${index + 1} left`} className="rounded p-1 text-slate-600 hover:bg-white disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700">
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => moveImage(index, 1)} disabled={index === imageItems.length - 1} aria-label={`Move image ${index + 1} right`} className="rounded p-1 text-slate-600 hover:bg-white disabled:opacity-30 dark:text-slate-300 dark:hover:bg-slate-700">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => removeImage(index)} aria-label={`Remove image ${index + 1}`} className="rounded px-1.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          {editingId && <button type="button" onClick={reset} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:text-white"><X className="h-4 w-4" /> Cancel</button>}
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-1 rounded-lg bg-[#0F2C59] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Post'}</button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {posts
          .slice()
          .sort((first, second) => second.date.localeCompare(first.date))
          .slice(0, 2)
          .map((post) => (
          <article key={post.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <FacebookPostPreview post={post} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{post.title}</h3>
                {post.isFallback && (
                  <span className="shrink-0 rounded bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                    From announcements
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{post.date}</p>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => openEdit(post)} className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:text-white"><Edit3 className="h-3.5 w-3.5" /> Edit</button>
                {!post.isFallback && (
                  <button type="button" onClick={() => setDeleteTarget(post)} className="inline-flex items-center gap-1 rounded border border-rose-300 px-2 py-1 text-xs text-rose-700"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                )}
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
      {cropFile && (
        <ImageCropper
          file={cropFile}
          aspectRatio={16 / 9}
          onCancel={cancelCropping}
          onComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
