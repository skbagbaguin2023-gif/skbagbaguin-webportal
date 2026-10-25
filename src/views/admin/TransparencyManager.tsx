import React, { useState } from 'react';
import { TransparencyDoc, DocCategory } from '../../types/index.ts';
import { 
  Upload, 
  Search, 
  FileText, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  X, 
  LoaderCircle
} from 'lucide-react';
import Reveal from '../../components/Reveal.jsx';
import { ConfirmationModal } from '../../components/modals/ConfirmationModal.tsx';
import { generateUuid } from '../../utils/uuid.ts';

interface TransparencyManagerProps {
  documents: TransparencyDoc[];
  onAddDoc: (doc: TransparencyDoc, file: File) => Promise<void>;
  onUpdateDoc: (doc: TransparencyDoc) => void;
  onDeleteDoc: (id: string) => Promise<void>;
}

export const TransparencyManager: React.FC<TransparencyManagerProps> = ({
  documents,
  onAddDoc,
  onUpdateDoc,
  onDeleteDoc,
}) => {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<TransparencyDoc | null>(null);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dropzoneFileInputRef = React.useRef<HTMLInputElement>(null);
  const modalFileInputRef = React.useRef<HTMLInputElement>(null);

  // New report form states
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<DocCategory>('Accomplishment Report');
  const [formYear, setFormYear] = useState(2026);
  const [formQuarter, setFormQuarter] = useState('Q4');
  const [formResolution, setFormResolution] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(true);

  const categories: DocCategory[] = [
    'Annual Investment Plan (AIP)',
    'CBYDP',
    'Financial & Liquidation',
    'Accomplishment Report',
    'SK Resolution',
  ];

  const filtered = documents.filter(
    (d) => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase())
  );

  const openUploadModal = (file?: File) => {
    setSelectedFile(file ?? null);
    setUploadError('');
    setIsModalOpen(true);
  };

  const validateSelectedFile = (file: File): boolean => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(null);
      setUploadError('Choose a PDF file.');
      return false;
    }
    if (file.size === 0 || file.size > 25 * 1024 * 1024) {
      setSelectedFile(null);
      setUploadError('Choose a non-empty PDF file up to 25 MB.');
      return false;
    }
    setSelectedFile(file);
    setUploadError('');
    return true;
  };

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Select or drop a PDF file before uploading.');
      return;
    }
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const documentId = `doc-${generateUuid()}`;
    const newDoc: TransparencyDoc = {
      id: documentId,
      title: formTitle.trim(),
      category: formCategory,
      year: Number(formYear),
      quarter: formQuarter,
      documentType: 'PDF',
      fileSize: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      resolutionNumber: formResolution || undefined,
      publishedDate: today,
      isPublic: formIsPublic,
      description: formDescription.trim(),
    };

    setIsUploading(true);
    setUploadError('');
    try {
      await onAddDoc(newDoc, selectedFile);
      setIsModalOpen(false);
      setSelectedFile(null);
      setFormTitle('');
      setFormResolution('');
      setFormDescription('');
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'The PDF could not be uploaded. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const toggleVisibility = (doc: TransparencyDoc) => {
    onUpdateDoc({
      ...doc,
      isPublic: !doc.isPublic,
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <Reveal className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Transparency & Financial Documents CMS</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Publish Commission on Audit liquidation summaries, AIP budgets, and legislative resolutions
          </p>
        </div>

        <button
          type="button"
          onClick={() => openUploadModal()}
          className="bg-[#0F2C59] hover:bg-navy-800 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Upload Official Report</span>
        </button>
      </Reveal>

      {/* Drag & Drop Quick Upload Area */}
      <Reveal
        onDragOver={(event: React.DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setIsDraggingFile(true);
        }}
        onDragLeave={(event: React.DragEvent<HTMLDivElement>) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDraggingFile(false);
        }}
        onDrop={(event: React.DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setIsDraggingFile(false);
          const file = event.dataTransfer.files[0];
          if (file) {
            if (validateSelectedFile(file)) {
              openUploadModal(file);
            } else {
              setIsModalOpen(true);
            }
          }
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center space-y-2 transition-colors ${
          isDraggingFile
            ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30'
            : 'border-slate-300 bg-white hover:bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/50'
        }`}
      >
        <Upload className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto" />
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Drag & Drop Audited Financial Reports</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Upload PDF scans of COA audited disbursements, SK resolutions, or youth development plans (Up to 25MB)
        </p>
        <input
          ref={dropzoneFileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              if (validateSelectedFile(file)) {
                openUploadModal(file);
              } else {
                setIsModalOpen(true);
              }
            }
            event.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => dropzoneFileInputRef.current?.click()}
          className="mt-2 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#0F2C59] dark:text-amber-400 font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
        >
          Select File to Upload
        </button>
      </Reveal>

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-72 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by title or resolution..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{filtered.length} Documents on Record</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Year & Resolution</th>
                <th className="py-3 px-4">Published Date</th>
                <th className="py-3 px-4">Public Visibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 max-w-xs">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">{doc.title}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] truncate block">{doc.description}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[#0F2C59] dark:text-amber-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-800 dark:text-slate-200">
                    <div>{doc.year} {doc.quarter ? `(${doc.quarter})` : ''}</div>
                    {doc.resolutionNumber && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">{doc.resolutionNumber}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">{doc.publishedDate}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleVisibility(doc)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                        doc.isPublic
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {doc.isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{doc.isPublic ? 'Public' : 'Restricted'}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setDocumentToDelete(doc)}
                      className="p-1 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/70 p-4 backdrop-blur-xs sm:items-center">
          <div className="my-0 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:my-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex shrink-0 items-center justify-between bg-[#0F2C59] px-6 py-4 text-white">
              <h3 className="font-bold text-base">Upload Official Transparency Document</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(event) => void handleCreateDoc(event)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files[0];
                if (file) validateSelectedFile(file);
              }}
              className="min-h-0 overflow-y-auto p-6 space-y-4 text-xs"
            >
              <div>
                <label htmlFor="transparency-pdf" className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  PDF File *
                </label>
                <input
                  ref={modalFileInputRef}
                  id="transparency-pdf"
                  type="file"
                  accept="application/pdf,.pdf"
                  disabled={isUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) validateSelectedFile(file);
                    event.target.value = '';
                  }}
                  className="block w-full rounded-lg border border-slate-300 p-2 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-300"
                />
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedFile
                    ? `Selected: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`
                    : 'Select a PDF file above, or drag and drop it into the upload area. Maximum size: 25 MB.'}
                </p>
                {uploadError && <p role="alert" className="mt-1 text-xs font-medium text-rose-600">{uploadError}</p>}
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  disabled={isUploading}
                  placeholder="e.g. SK Bagbaguin 4th Quarter Financial Liquidation Report"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-[#0F2C59] dark:focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    disabled={isUploading}
                    onChange={(e) => setFormCategory(e.target.value as DocCategory)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Fiscal Year
                  </label>
                  <input
                    type="number"
                    disabled={isUploading}
                    value={formYear}
                    onChange={(e) => setFormYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Council Resolution Tracking No. (Optional)
                </label>
                <input
                  type="text"
                  disabled={isUploading}
                  placeholder="e.g. SK Res. No. 07-2026"
                  value={formResolution}
                  onChange={(e) => setFormResolution(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Summary / Scope Description *
                </label>
                <textarea
                  required
                  disabled={isUploading}
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isUploading}
                    checked={formIsPublic}
                    onChange={(e) => setFormIsPublic(e.target.checked)}
                    className="w-4 h-4 text-[#0F2C59] dark:accent-amber-500 rounded"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Publish immediately to Public Transparency Board
                  </span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 bg-[#0F2C59] hover:bg-navy-800 text-white font-bold px-5 py-2 rounded-lg text-xs cursor-pointer shadow-xs disabled:cursor-wait disabled:opacity-70"
                >
                  {isUploading && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
                  {isUploading ? 'Uploading PDF...' : 'Confirm & Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={documentToDelete !== null}
        title="Remove this document?"
        message={deleteError || (documentToDelete ? `Remove "${documentToDelete.title}" and its uploaded PDF?` : '')}
        confirmLabel="Remove Document"
        isLoading={isDeletingDocument}
        onConfirm={async () => {
          if (!documentToDelete) return;
          setIsDeletingDocument(true);
          setDeleteError('');
          try {
            await onDeleteDoc(documentToDelete.id);
            setDocumentToDelete(null);
          } catch (error) {
            setDeleteError(error instanceof Error ? error.message : 'The document could not be deleted.');
          } finally {
            setIsDeletingDocument(false);
          }
        }}
        onCancel={() => {
          setDocumentToDelete(null);
          setDeleteError('');
        }}
      />
    </div>
  );
};
