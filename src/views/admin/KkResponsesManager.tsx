import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Download, LoaderCircle, RefreshCw, Save, Search } from 'lucide-react';
import type { KkAdminResponse, KkAggregateReport, KkResponseStatus } from '../../types/index.ts';
import {
  exportKkResponsesCsv,
  fetchKkAggregateReport,
  fetchKkResponses,
  reviewKkResponse,
} from '../../services/supabaseData.ts';

const PAGE_SIZE = 50;

const statusLabels: Record<KkResponseStatus, string> = {
  pending: 'Pending',
  verified: 'Verified',
  needs_review: 'Needs review',
  rejected: 'Rejected',
};

function displayDate(value: string | null): string {
  if (!value) return 'Not provided';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export const KkResponsesManager: React.FC = () => {
  const [responses, setResponses] = useState<KkAdminResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [report, setReport] = useState<KkAggregateReport | null>(null);
  const [statusFilter, setStatusFilter] = useState<KkResponseStatus | ''>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<KkResponseStatus>('needs_review');
  const [reviewNotes, setReviewNotes] = useState('');
  const [exportPurpose, setExportPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const selectedResponse = useMemo(
    () => responses.find((response) => response.id === selectedId) ?? null,
    [responses, selectedId]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage('');
    fetchKkResponses({
      status: statusFilter,
      search: debouncedSearch,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    }).then(({ responses: nextResponses, totalCount: nextCount }) => {
      if (!active) return;
      setResponses(nextResponses);
      setTotalCount(nextCount);
    }).catch((error: unknown) => {
      if (!active) return;
      setErrorMessage(error instanceof Error ? error.message : 'KK responses could not be loaded.');
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [statusFilter, debouncedSearch, page, refreshKey]);

  useEffect(() => {
    let active = true;
    fetchKkAggregateReport().then((result) => {
      if (active) setReport(result);
    }).catch((error: unknown) => {
      if (active) {
        setErrorMessage(error instanceof Error ? error.message : 'KK report could not be loaded.');
      }
    });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedResponse) return;
    setEditStatus(selectedResponse.status);
    setReviewNotes(selectedResponse.review_notes);
  }, [selectedResponse]);

  const handleSaveReview = async () => {
    if (!selectedResponse) return;
    setIsSaving(true);
    setErrorMessage('');
    setNotice('');
    try {
      await reviewKkResponse(selectedResponse.id, editStatus, reviewNotes);
      setNotice(`Review saved for ${selectedResponse.ref_number}.`);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'KK review could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage('');
    setNotice('');
    try {
      const csv = await exportKkResponsesCsv(exportPurpose);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `kk-responses-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setNotice('The full-record CSV was generated and the export was logged.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'KK response export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="space-y-6" aria-labelledby="kk-responses-heading">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
          Restricted administrator workspace
        </p>
        <h1 id="kk-responses-heading" className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
          KK Profiling Responses
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
          Review registration records and legacy imports. Access and full-record exports are recorded in the audit log.
        </p>
      </header>

      {report && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Aggregate response counts">
          {[
            ['Needs review', report.needs_review],
            ['Pending', report.pending],
            ['Verified', report.verified],
            ['Rejected', report.rejected],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
          ))}
          <p className="col-span-full text-xs text-slate-500 dark:text-slate-400">
            Aggregate counts below five are suppressed.
          </p>
        </div>
      )}

      {errorMessage && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          {notice}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="KK response queue">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-800 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search by reference or name</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reference or name"
                maxLength={100}
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-[#0F2C59] focus:ring-2 focus:ring-[#0F2C59]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </label>
            <label>
              <span className="sr-only">Filter by review status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as KkResponseStatus | '')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:w-auto"
              >
                <option value="">All statuses</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label="Refresh response list"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3">Reference / Applicant</th>
                  <th scope="col" className="px-4 py-3">Source</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {responses.map((response) => (
                  <tr key={response.id} className={selectedId === response.id ? 'bg-amber-50/70 dark:bg-amber-950/20' : ''}>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedId(response.id)}
                        className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F2C59]"
                      >
                        <span className="block font-bold text-[#0F2C59] dark:text-amber-300">{response.ref_number}</span>
                        <span className="mt-0.5 block text-slate-700 dark:text-slate-200">
                          {[response.first_name, response.middle_name, response.last_name].filter(Boolean).join(' ')}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {response.source === 'portal' ? 'Portal' : 'Legacy import'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {statusLabels[response.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{displayDate(response.created_at)}</td>
                  </tr>
                ))}
                {!isLoading && responses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                      No KK responses match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {isLoading && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500" role="status">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading restricted records…
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              {totalCount === 0 ? 0 : page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0 || isLoading}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40 dark:border-slate-700"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={(page + 1) * PAGE_SIZE >= totalCount || isLoading}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40 dark:border-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          {selectedResponse && (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="kk-review-heading">
              <h2 id="kk-review-heading" className="text-lg font-bold text-slate-900 dark:text-white">
                Review {selectedResponse.ref_number}
              </h2>
              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {[
                  ['Name', [selectedResponse.first_name, selectedResponse.middle_name, selectedResponse.last_name].filter(Boolean).join(' ')],
                  ['Age / birthday', `${selectedResponse.age ?? 'Not provided'} / ${displayDate(selectedResponse.birthday)}`],
                  ['Contact', selectedResponse.contact_number || 'Not provided'],
                  ['Email', selectedResponse.email || selectedResponse.email_address || selectedResponse.email_account || 'Not provided'],
                  ['Sitio', [selectedResponse.sitio_address, selectedResponse.sitio_other].filter(Boolean).join(' — ') || 'Not provided'],
                  ['Address', selectedResponse.complete_address || 'Not provided'],
                  ['Source timestamp', displayDate(selectedResponse.original_timestamp || selectedResponse.created_at)],
                  ['Review required', selectedResponse.needs_review ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
                    <dd className="mt-0.5 break-words text-slate-800 dark:text-slate-100">{value}</dd>
                  </div>
                ))}
              </dl>
              {selectedResponse.youth_classifications.length > 0 && (
                <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                  <span className="font-semibold">Youth classifications:</span> {selectedResponse.youth_classifications.join(', ')}
                </p>
              )}
              <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Review status
                  <select
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value as KkResponseStatus)}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Internal review notes
                  <textarea
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    maxLength={2000}
                    rows={3}
                    className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleSaveReview()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0F2C59] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
                  Save review
                </button>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/30" aria-labelledby="kk-export-heading">
            <h2 id="kk-export-heading" className="text-base font-bold text-slate-900 dark:text-white">Full-record export</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              CSV may contain sensitive personal data. Enter the official purpose; the server checks your administrator role and records the export.
            </p>
            <label className="mt-3 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              Export purpose
              <textarea
                value={exportPurpose}
                onChange={(event) => setExportPurpose(event.target.value)}
                minLength={8}
                maxLength={200}
                rows={2}
                placeholder="For example: 2026 KK profiling validation"
                className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <button
              type="button"
              disabled={isExporting || exportPurpose.trim().length < 8}
              onClick={() => void handleExport()}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50 dark:bg-slate-900 dark:text-white"
            >
              {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
              Generate audited CSV
            </button>
          </section>
        </div>
      </div>
    </section>
  );
};
