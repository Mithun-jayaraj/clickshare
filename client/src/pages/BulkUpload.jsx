import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Download,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Link2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/layout/Sidebar.jsx';
import api from '../api/axios.js';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

// ─── CSV / text parsers ────────────────────────────────────────────────────

/** Parse raw CSV text into array of objects {url, alias, expiry} */
const parseCSV = (text) => {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length === 0) return [];

  // Detect if first row is a header
  const firstLower = lines[0].toLowerCase();
  const hasHeader =
    firstLower.includes('url') ||
    firstLower.includes('link') ||
    firstLower.includes('alias');

  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines
    .map((line) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const url = cols[0] || '';
      const alias = cols[1] || '';
      const expiry = cols[2] || '';
      return { originalUrl: url, customAlias: alias || undefined, expiresAt: expiry || undefined };
    })
    .filter((r) => r.originalUrl);
};

/** Parse a plain text area (one URL per line, optional | separator for alias) */
const parseText = (text) => {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const [url, alias, expiry] = line.split('|').map((s) => s.trim());
      return { originalUrl: url, customAlias: alias || undefined, expiresAt: expiry || undefined };
    })
    .filter((r) => r.originalUrl);
};

/** Generate and trigger download of a CSV file */
const downloadCSV = (results) => {
  const header = 'Original URL,Custom Alias,Short URL,Status,Error\n';
  const rows = results.map((r) =>
    [
      `"${r.originalUrl}"`,
      `"${r.customAlias || ''}"`,
      `"${r.shortUrl || ''}"`,
      r.success ? 'Success' : 'Failed',
      `"${r.message || ''}"`,
    ].join(',')
  );
  const blob = new Blob([header + rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clicksphere-bulk-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Generate a sample CSV template for download */
const downloadTemplate = () => {
  const content =
    'url,alias,expiry\nhttps://example.com,my-link,2025-12-31\nhttps://google.com,,\nhttps://github.com,gh-link,\n';
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'clicksphere-bulk-template.csv';
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Sub-components ────────────────────────────────────────────────────────

const StatusBadge = ({ success }) =>
  success ? (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
      <CheckCircle2 size={11} /> Done
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
      <XCircle size={11} /> Failed
    </span>
  );

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={handle}
      className="p-1 rounded text-slate-400 hover:text-indigo-500 transition-colors"
      title="Copy"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────

const BulkUpload = () => {
  const [tab, setTab] = useState('paste'); // 'paste' | 'csv'
  const [pasteText, setPasteText] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [preview, setPreview] = useState([]); // parsed rows before upload
  const [results, setResults] = useState([]); // post-upload results
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef(null);

  // ── Parse handlers ────────────────────────────────────────────
  const handleParseText = () => {
    if (!pasteText.trim()) return toast.error('Paste some URLs first.');
    const rows = parseText(pasteText);
    if (rows.length === 0) return toast.error('No valid URLs found in the pasted text.');
    if (rows.length > 100) return toast.error('Max 100 URLs per batch. Please split into smaller batches.');
    setPreview(rows);
    setShowPreview(true);
    toast.success(`${rows.length} URL${rows.length > 1 ? 's' : ''} parsed. Review and upload.`);
  };

  const handleParseCSV = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.txt')) {
      return toast.error('Please upload a CSV (.csv) or TXT (.txt) file.');
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target.result);
      if (rows.length === 0) return toast.error('No valid URLs found in the file.');
      if (rows.length > 100) return toast.error('Max 100 URLs per batch. Your file has more rows.');
      setPreview(rows);
      setShowPreview(true);
      setCsvFile(file);
      toast.success(`${rows.length} URL${rows.length > 1 ? 's' : ''} parsed from file.`);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleParseCSV(file);
  }, []);

  // ── Upload ────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (preview.length === 0) return toast.error('No URLs to upload.');
    setUploading(true);
    setProgress(10);
    try {
      const tick = setInterval(() => setProgress((p) => Math.min(p + 8, 85)), 300);
      const { data } = await api.post('/urls/bulk', { urls: preview });
      clearInterval(tick);
      setProgress(100);
      setTimeout(() => setProgress(0), 600);
      setResults(data.results || []);
      setShowResults(true);
      setShowPreview(false);
      setPreview([]);
      setPasteText('');
      setCsvFile(null);
      const ok = data.succeeded || 0;
      const fail = data.failed || 0;
      if (fail === 0) {
        toast.success(`🎉 All ${ok} links created successfully!`);
      } else {
        toast(`✅ ${ok} succeeded · ❌ ${fail} failed`, { icon: '⚡' });
      }
    } catch (err) {
      setProgress(0);
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setPreview([]);
    setResults([]);
    setShowResults(false);
    setShowPreview(false);
    setPasteText('');
    setCsvFile(null);
  };

  const succeededCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="max-w-4xl mx-auto px-6 py-10">

          {/* ── Header ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Upload size={20} className="text-indigo-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Bulk URL Upload
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Shorten up to 100 URLs at once via paste or CSV file upload
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Instructions card ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border p-4 mb-6 flex flex-wrap items-center gap-4"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-start gap-3 flex-1 min-w-[200px]">
              <AlertCircle size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>CSV format:</strong>{' '}
                <code className="bg-slate-100 text-slate-600 px-1 rounded text-xs">url, alias (opt), expiry (opt)</code>
                <br />
                <strong style={{ color: 'var(--text-primary)' }}>Text format:</strong>{' '}
                <code className="bg-slate-100 text-slate-600 px-1 rounded text-xs">https://url.com | alias | YYYY-MM-DD</code>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              id="btn-download-template"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download size={13} /> Download Template CSV
            </button>
          </motion.div>

          {/* ── Input Card ─────────────────────────────────── */}
          {!showResults && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border overflow-hidden mb-6"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              {/* Tabs */}
              <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
                {[
                  { id: 'paste', label: '📋 Paste URLs' },
                  { id: 'csv',   label: '📄 Upload CSV / TXT' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setShowPreview(false); setPreview([]); }}
                    className="px-5 py-3 text-sm font-semibold transition-colors"
                    style={{
                      color: tab === t.id ? 'var(--primary)' : 'var(--text-secondary)',
                      borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
                      background: 'transparent',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                <AnimatePresence mode="wait">
                  {tab === 'paste' ? (
                    <motion.div key="paste" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        One URL per line · optional: <code className="font-normal">url | alias | YYYY-MM-DD</code>
                      </label>
                      <textarea
                        id="bulk-paste-input"
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        rows={10}
                        placeholder={
                          'https://verylongurl.com/page-one\nhttps://example.com/blog | blog-link\nhttps://docs.example.com | docs | 2025-12-31'
                        }
                        className="w-full rounded-lg border text-sm font-mono resize-y"
                        style={{
                          padding: '12px 14px',
                          background: 'var(--input-bg)',
                          borderColor: 'var(--border)',
                          color: 'var(--text-primary)',
                          outline: 'none',
                          minHeight: 200,
                        }}
                        onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                        onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                      />
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {pasteText.trim().split(/\r?\n/).filter(Boolean).length} / 100 URLs
                        </span>
                        <button
                          onClick={handleParseText}
                          id="btn-parse-text"
                          className="px-4 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-lg hover:bg-indigo-600 transition-colors"
                        >
                          Parse & Preview →
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="csv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div
                        id="bulk-drop-zone"
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                        className="rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 p-12"
                        style={{
                          borderColor: dragOver ? 'var(--primary)' : 'var(--border)',
                          background: dragOver ? (document.documentElement.classList.contains('dark') ? 'rgba(99,102,241,0.08)' : '#f0f4ff') : 'var(--surface)',
                        }}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                          <FileText size={26} className="text-indigo-400" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {csvFile ? csvFile.name : 'Drop your CSV or TXT file here'}
                          </p>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                            {csvFile ? 'File loaded — click to change' : 'or click to browse · max 100 rows'}
                          </p>
                        </div>
                      </div>
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        onChange={(e) => handleParseCSV(e.target.files?.[0])}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* ── Preview Table ───────────────────────────────── */}
          <AnimatePresence>
            {showPreview && preview.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border mb-6 overflow-hidden"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <Link2 size={16} className="text-indigo-500" />
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                      Preview — {preview.length} URL{preview.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPreview((p) => !p)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPreview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <button
                      onClick={reset}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b" style={{ borderColor: 'var(--border)' }}>
                        {['#', 'Destination URL', 'Alias', 'Expiry'].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b hover:bg-slate-50/50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                          <td className="px-4 py-2.5 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-2.5 font-mono text-xs truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>
                            {row.originalUrl}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-indigo-500 font-mono">{row.customAlias || '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-400">{row.expiresAt || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Progress bar */}
                {uploading && progress > 0 && (
                  <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-indigo-500">Uploading…</span>
                      <span className="text-xs text-slate-400">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        className="h-full bg-indigo-500 rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}

                <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Ready to shorten {preview.length} URLs
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={reset}
                      className="px-4 py-2 text-sm font-semibold rounded-lg border transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      id="btn-bulk-upload"
                      className="px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-60 transition-colors flex items-center gap-2"
                    >
                      {uploading && <Loader2 size={14} className="animate-spin" />}
                      {uploading ? 'Uploading…' : `🚀 Shorten ${preview.length} URLs`}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Results ─────────────────────────────────────── */}
          <AnimatePresence>
            {showResults && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border overflow-hidden"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                {/* Summary bar */}
                <div className="px-5 py-4 border-b flex flex-wrap items-center gap-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-600">{succeededCount} succeeded</span>
                    </div>
                    {failedCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <XCircle size={16} className="text-red-400" />
                        <span className="text-sm font-bold text-red-500">{failedCount} failed</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadCSV(results)}
                      id="btn-download-results"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-500 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <Download size={13} /> Download Results CSV
                    </button>
                    <button
                      onClick={reset}
                      id="btn-new-batch"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                    >
                      <Upload size={13} /> New Batch
                    </button>
                  </div>
                </div>

                {/* Results table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-slate-50" style={{ borderColor: 'var(--border)' }}>
                        {['#', 'Original URL', 'Short URL', 'Status', 'Note'].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr
                          key={i}
                          className="border-b hover:bg-slate-50/50 transition-colors"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[200px] truncate" title={r.originalUrl}>
                            {r.originalUrl}
                          </td>
                          <td className="px-4 py-3">
                            {r.success && r.shortUrl ? (
                              <div className="flex items-center gap-1">
                                <a
                                  href={r.shortUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-mono text-indigo-500 hover:underline"
                                >
                                  {`${BASE_URL}/${r.shortCode}`}
                                </a>
                                <CopyBtn text={r.shortUrl} />
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge success={r.success} />
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400 max-w-[180px] truncate" title={r.message}>
                            {r.message || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default BulkUpload;
