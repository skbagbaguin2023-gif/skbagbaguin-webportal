import React, { useEffect, useState } from 'react';
import { TransparencyDoc } from '../../types/index.ts';
import { X, FileText, Download, ShieldCheck, Calendar, Hash, LoaderCircle } from 'lucide-react';
import { getTransparencyDocumentSignedUrl } from '../../services/supabaseData.ts';

interface DocumentPreviewModalProps {
  doc: TransparencyDoc | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  doc,
  isOpen,
  onClose,
}) => {
  const [signedUrl, setSignedUrl] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    setSignedUrl('');
    setLoadError('');

    if (isOpen && doc?.storagePath) {
      setIsLoading(true);
      void getTransparencyDocumentSignedUrl(doc.storagePath)
        .then((url) => {
          if (isCurrent) setSignedUrl(url);
        })
        .catch((error: unknown) => {
          if (isCurrent) {
            setLoadError(error instanceof Error ? error.message : 'Could not load the PDF.');
          }
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      isCurrent = false;
    };
  }, [doc, isOpen]);

  if (!isOpen || !doc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0F2C59] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                Public Transparency Record
              </span>
              <h2 className="text-base font-bold truncate max-w-md">
                {doc.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 pb-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Format: <strong>{doc.documentType}</strong> ({doc.fileSize})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>Published: {doc.publishedDate}</span>
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="font-semibold text-slate-700 dark:text-slate-200">Document Overview:</div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {doc.description}
            </p>
          </div>

          {doc.resolutionNumber && (
            <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-900/60">
              <Hash className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>Resolution Tracking: <strong>{doc.resolutionNumber}</strong></span>
            </div>
          )}

          {doc.storagePath && signedUrl ? (
            <iframe
              title={`PDF preview: ${doc.title}`}
              src={signedUrl}
              className="h-[55vh] min-h-64 w-full rounded-xl border border-slate-300 dark:border-slate-700"
            />
          ) : (
            <div className="border border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center">
              {isLoading ? (
                <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#0F2C59] dark:text-amber-400" />
              ) : (
                <>
                  <FileText className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    {loadError || 'This older transparency record has no attached PDF file.'}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>COA & DILG Seal Verified</span>
            </span>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              {signedUrl && (
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0F2C59] hover:bg-navy-800 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open / Download PDF ({doc.fileSize})</span>
                </a>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
