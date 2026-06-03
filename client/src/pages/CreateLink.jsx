import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Link2, Copy, Check, Zap, Calendar, Sparkles, Loader2, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import Sidebar from '../components/layout/Sidebar.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import useUrls from '../hooks/useUrls.js';
import { isValidUrl, isValidAlias, copyToClipboard } from '../utils/validators.js';
import { useTheme } from '../context/ThemeContext.jsx';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

// ── Confetti ──────────────────────────────────────────────────
const Confetti = () => {
  const colors = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ x: Math.random() * 300 - 150, y: -20, rotate: 0, opacity: 1, scale: 1 }}
          animate={{ y: 200, rotate: Math.random() * 720 - 360, opacity: 0, scale: 0.5 }}
          transition={{ duration: 1.5, delay: Math.random() * 0.5, ease: 'easeOut' }}
          className="absolute top-0 left-1/2 w-2 h-2 rounded-sm"
          style={{ backgroundColor: colors[i % colors.length] }}
        />
      ))}
    </div>
  );
};

// ── AI Title suggestions ──────────────────────────────────────
const AI_TITLE_TEMPLATES = [
  (domain) => `Visit ${domain} — Shortened Link`,
  (domain) => `${domain} — Quick Access`,
  (domain) => `Click here to open ${domain}`,
  (domain) => `${domain} Link`,
  (domain) => `Access ${domain} now`,
];

const generateAiTitles = (url) => {
  try {
    const { hostname } = new URL(url);
    const domain = hostname.replace('www.', '');
    const baseName = domain.split('.')[0];
    const capitalised = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    return [
      `${capitalised} — Official Resource`,
      `Visit ${domain}`,
      `${capitalised} Link (Shortened)`,
      `Open ${capitalised} Page`,
      `${capitalised} — Quick Access`,
    ];
  } catch {
    return [];
  }
};

// ── Main component ────────────────────────────────────────────
const CreateLink = () => {
  const navigate = useNavigate();
  const { createUrl } = useUrls();
  const { isDark } = useTheme();

  const [form, setForm] = useState({ originalUrl: '', customAlias: '', expiresAt: '', title: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // AI title
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.originalUrl.trim()) {
      e.originalUrl = 'Destination URL is required';
    } else if (!isValidUrl(form.originalUrl.trim())) {
      e.originalUrl = 'Please enter a valid URL (must start with http:// or https://)';
    }
    if (form.customAlias && !isValidAlias(form.customAlias)) {
      e.customAlias = 'Alias must be 3–30 characters (letters, numbers, hyphens, underscores)';
    }
    if (form.expiresAt && new Date(form.expiresAt) <= new Date()) {
      e.expiresAt = 'Expiry date must be in the future';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const result = await createUrl({
      originalUrl: form.originalUrl.trim(),
      customAlias: form.customAlias.trim() || undefined,
      expiresAt: form.expiresAt || undefined,
    });
    setLoading(false);
    if (result.success) {
      setCreated({ ...result.url, title: form.title });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      toast.success('Short link created!');
    } else {
      toast.error(result.message);
    }
  };

  const handleCopy = async () => {
    if (!created) return;
    const shortUrl = `${BASE_URL}/${created.shortCode}`;
    await copyToClipboard(shortUrl);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setCreated(null);
    setForm({ originalUrl: '', customAlias: '', expiresAt: '', title: '' });
    setErrors({});
    setAiSuggestions([]);
    setShowSuggestions(false);
  };

  const handleChange = (field) => (e) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
    // reset AI suggestions when URL changes
    if (field === 'originalUrl') {
      setAiSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // AI title generation — client-side, no API key needed
  const handleGenerateTitle = async () => {
    const url = form.originalUrl.trim();
    if (!url) {
      toast.error('Enter a destination URL first');
      return;
    }
    if (!isValidUrl(url)) {
      toast.error('Please enter a valid URL');
      return;
    }
    setAiLoading(true);
    setShowSuggestions(false);
    // Simulate brief AI "thinking" delay for UX polish
    await new Promise((r) => setTimeout(r, 800));
    const suggestions = generateAiTitles(url);
    setAiSuggestions(suggestions);
    setShowSuggestions(true);
    setAiLoading(false);
    toast.success('AI title suggestions ready!');
  };

  const pickSuggestion = (title) => {
    setForm((p) => ({ ...p, title }));
    setShowSuggestions(false);
    toast.success('Title applied!');
  };

  const today = new Date();
  today.setDate(today.getDate() + 1);
  const minDate = today.toISOString().split('T')[0];

  const cardBg = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-card)',
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="max-w-xl mx-auto px-6 py-12">
          {/* Back */}
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors group"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Header */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff' }}
                >
                  <Link2 size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create a new link</h1>
              </div>
              <p className="text-sm ml-12" style={{ color: 'var(--text-secondary)' }}>
                Shorten any URL and start tracking clicks instantly.
              </p>
            </div>

            {/* Card */}
            <div style={cardBg} className="overflow-hidden">
              <AnimatePresence mode="wait">
                {!created ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-7"
                  >
                    <form onSubmit={handleSubmit} noValidate className="space-y-5">
                      {/* Destination URL */}
                      <Input
                        id="create-destination-url"
                        label="Destination URL"
                        type="url"
                        placeholder="https://example.com/very/long/url"
                        value={form.originalUrl}
                        onChange={handleChange('originalUrl')}
                        error={errors.originalUrl}
                        required
                        hint="The full URL you want to shorten"
                      />

                      {/* AI Title Generator */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                            Link Title <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleGenerateTitle}
                            disabled={aiLoading}
                            id="btn-ai-generate-title"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: isDark ? 'rgba(99,102,241,0.2)' : '#eef2ff',
                              color: 'var(--primary)',
                              border: '1px solid var(--primary)',
                              opacity: aiLoading ? 0.7 : 1,
                            }}
                          >
                            {aiLoading
                              ? <Loader2 size={11} className="animate-spin" />
                              : <Sparkles size={11} />
                            }
                            {aiLoading ? 'Generating…' : 'AI Generate'}
                          </button>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            id="create-link-title"
                            placeholder="e.g. Summer Campaign Link"
                            value={form.title}
                            onChange={handleChange('title')}
                            className="w-full"
                            style={{
                              background: 'var(--input-bg)',
                              border: '1.5px solid var(--border)',
                              borderRadius: '8px',
                              padding: '10px 14px',
                              fontSize: '14px',
                              color: 'var(--text-primary)',
                              outline: 'none',
                              transition: 'border-color 0.15s',
                            }}
                            onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
                          />

                          {/* AI suggestions dropdown */}
                          <AnimatePresence>
                            {showSuggestions && aiSuggestions.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                className="absolute left-0 right-0 z-20 mt-1.5 rounded-xl overflow-hidden"
                                style={{
                                  background: 'var(--card)',
                                  border: '1.5px solid var(--border)',
                                  boxShadow: 'var(--shadow-card-hover)',
                                }}
                              >
                                <p
                                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                                  style={{
                                    color: 'var(--primary)',
                                    borderBottom: '1px solid var(--border)',
                                    background: isDark ? 'rgba(99,102,241,0.08)' : '#f8f9ff',
                                  }}
                                >
                                  <Sparkles size={11} /> AI Suggestions — click to apply
                                </p>
                                {aiSuggestions.map((s, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => pickSuggestion(s)}
                                    className="w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2"
                                    style={{ color: 'var(--text-primary)' }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(99,102,241,0.12)' : '#f0f4ff')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                                  >
                                    <Tag size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                    {s}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          A friendly name for this link — use AI to generate suggestions from the URL.
                        </p>
                      </div>

                      {/* Custom Alias */}
                      <Input
                        id="create-custom-alias"
                        label="Custom Alias (optional)"
                        type="text"
                        placeholder="my-brand-link"
                        value={form.customAlias}
                        onChange={handleChange('customAlias')}
                        error={errors.customAlias}
                        prefix={<span className="text-slate-400 text-xs">{BASE_URL}/</span>}
                        hint="Leave empty for a random 6-character code"
                      />

                      {/* Expiry Date */}
                      <Input
                        id="create-expiry-date"
                        label="Expiry Date (optional)"
                        type="date"
                        min={minDate}
                        value={form.expiresAt}
                        onChange={handleChange('expiresAt')}
                        error={errors.expiresAt}
                        suffix={<Calendar size={15} className="text-slate-400" />}
                        hint="Link will stop redirecting after this date"
                      />

                      <Button
                        type="submit"
                        variant="primary"
                        fullWidth
                        size="lg"
                        loading={loading}
                        icon={<Zap size={16} />}
                        className="mt-2"
                        id="btn-generate-link"
                      >
                        Generate Short Link
                      </Button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-7 relative"
                  >
                    {showConfetti && <Confetti />}

                    {/* Success icon */}
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ background: isDark ? 'rgba(52,211,153,0.15)' : '#d1fae5' }}
                      >
                        <Check size={28} style={{ color: 'var(--success)' }} strokeWidth={3} />
                      </motion.div>
                      <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Link created!</h2>
                      {created.title && (
                        <p className="text-sm font-medium mb-0.5" style={{ color: 'var(--primary)' }}>
                          "{created.title}"
                        </p>
                      )}
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your short link is ready to share</p>
                    </div>

                    {/* Short URL display */}
                    <div
                      className="rounded-xl p-4 mb-5"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        Short URL
                      </p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-base font-bold font-mono" style={{ color: 'var(--primary)' }}>
                          {BASE_URL}/{created.shortCode}
                        </span>
                        <button
                          onClick={handleCopy}
                          id="btn-copy-created-link"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                          style={{
                            background: copied
                              ? (isDark ? 'rgba(52,211,153,0.15)' : '#d1fae5')
                              : (isDark ? 'rgba(99,102,241,0.15)' : '#e0e7ff'),
                            color: copied ? 'var(--success)' : 'var(--primary)',
                          }}
                        >
                          {copied ? <Check size={14} /> : <Copy size={14} />}
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <div className="mt-3 pt-3 flex gap-4 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <span>0 clicks</span>
                        <span>·</span>
                        <span className="truncate">
                          {created.originalUrl.slice(0, 40)}{created.originalUrl.length > 40 ? '...' : ''}
                        </span>
                        {created.expiresAt && (
                          <>
                            <span>·</span>
                            <span>Expires {new Date(created.expiresAt).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="ghost" fullWidth onClick={handleReset} id="btn-create-another">
                        Create Another
                      </Button>
                      <Button variant="primary" fullWidth onClick={() => navigate('/dashboard')} id="btn-go-to-dashboard">
                        Go to Dashboard
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default CreateLink;
