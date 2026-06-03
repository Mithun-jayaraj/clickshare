import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, TrendingUp, MousePointer, Globe, Calendar,
  ExternalLink, Download, FileText, FileJson,
} from 'lucide-react';
import api from '../api/axios.js';
import Sidebar from '../components/layout/Sidebar.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import ClickTrendChart from '../components/charts/ClickTrendChart.jsx';
import DeviceBreakdown from '../components/charts/DeviceBreakdown.jsx';
import { formatDate, formatRelativeTime } from '../utils/validators.js';
import { useTheme } from '../context/ThemeContext.jsx';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';

// ── KPI Card ─────────────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, colorBg, colorText, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="rounded-xl p-5"
    style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
  >
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
      style={{ background: colorBg, color: colorText }}
    >
      <Icon size={18} />
    </div>
    <p className="text-2xl font-extrabold mb-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</p>
  </motion.div>
);

// ── CSV Export helpers ────────────────────────────────────────
const toCSV = (rows, headers) => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = headers.join(',');
  const body = rows.map((r) => headers.map((h) => escape(r[h])).join(',')).join('\n');
  return `${head}\n${body}`;
};

const downloadFile = (content, filename, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const exportCSV = (data, urlId) => {
  if (!data) return;
  const prefix = urlId ? `link-${data.url?.shortCode}` : 'overview';

  if (urlId) {
    // Export recent visits
    const rows = (data.recentVisits || []).map((v) => ({
      timestamp: new Date(v.timestamp).toISOString(),
      country: v.country || 'Unknown',
      device: v.device || 'Unknown',
      browser: v.browser || 'Unknown',
    }));
    const csv = toCSV(rows, ['timestamp', 'country', 'device', 'browser']);
    downloadFile(csv, `${prefix}-visits.csv`, 'text/csv');

    // Also export click trend
    const trendRows = (data.clickTrend || []).map((d) => ({ date: d.date, clicks: d.clicks }));
    const trendCsv = toCSV(trendRows, ['date', 'clicks']);
    downloadFile(trendCsv, `${prefix}-click-trend.csv`, 'text/csv');
  } else {
    // Export overview top URLs
    const rows = (data.topUrls || []).map((u) => ({
      shortCode: u.shortCode,
      shortUrl: u.shortUrl,
      originalUrl: u.originalUrl,
      clicks: u.clickCount,
    }));
    const csv = toCSV(rows, ['shortCode', 'shortUrl', 'originalUrl', 'clicks']);
    downloadFile(csv, `${prefix}-top-urls.csv`, 'text/csv');

    // Export click trend
    const trendRows = (data.clickTrend || []).map((d) => ({ date: d.date, clicks: d.clicks }));
    const trendCsv = toCSV(trendRows, ['date', 'clicks']);
    downloadFile(trendCsv, `${prefix}-click-trend.csv`, 'text/csv');
  }
};

const exportJSON = (data, overview, urlId) => {
  const payload = urlId ? data : overview;
  downloadFile(
    JSON.stringify(payload, null, 2),
    urlId ? `link-${data?.url?.shortCode}-analytics.json` : 'overview-analytics.json',
    'application/json'
  );
};

// ── Export Button ─────────────────────────────────────────────
const ExportMenu = ({ onCSV, onJSON, isDark }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        id="btn-export-analytics"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff',
          color: 'var(--primary)',
          border: '1px solid var(--primary)',
        }}
      >
        <Download size={15} />
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute right-0 mt-1.5 w-44 z-20 rounded-xl overflow-hidden"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-card-hover)',
            }}
          >
            <button
              onClick={() => { onCSV(); setOpen(false); }}
              id="btn-export-csv"
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FileText size={14} style={{ color: 'var(--success)' }} />
              Export as CSV
            </button>
            <button
              onClick={() => { onJSON(); setOpen(false); }}
              id="btn-export-json"
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors"
              style={{ color: 'var(--text-primary)', borderTop: '1px solid var(--border)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <FileJson size={14} style={{ color: 'var(--primary)' }} />
              Export as JSON
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
};

// ── Main Analytics Page ───────────────────────────────────────
const Analytics = () => {
  const { urlId } = useParams();
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (urlId) {
          const { data: res } = await api.get(`/analytics/${urlId}`);
          setData(res.analytics);
        } else {
          const { data: res } = await api.get('/analytics/overview');
          setOverview(res.overview);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [urlId]);

  const kpiColors = {
    indigo: { bg: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff', text: 'var(--primary)' },
    cyan:   { bg: isDark ? 'rgba(6,182,212,0.15)'  : '#ecfeff', text: 'var(--secondary)' },
    green:  { bg: isDark ? 'rgba(52,211,153,0.15)' : '#d1fae5', text: 'var(--success)' },
    amber:  { bg: isDark ? 'rgba(251,191,36,0.15)' : '#fffbeb', text: 'var(--warning)' },
  };

  const cardStyle = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
  };

  const renderContent = () => {
    if (loading) return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" color="indigo" />
      </div>
    );

    if (error) return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p style={{ color: 'var(--danger)' }} className="font-medium mb-2">{error}</p>
        <Link to="/dashboard" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>
          ← Back to Dashboard
        </Link>
      </div>
    );

    // ── Per-URL analytics ──
    if (urlId && data) return (
      <div className="space-y-6">
        {/* URL info */}
        <div className="p-5" style={cardStyle}>
          <p className="text-xs uppercase tracking-wider font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Tracking link
          </p>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <a
                href={`${BASE_URL}/${data.url?.shortCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold font-mono flex items-center gap-1.5 hover:opacity-80"
                style={{ color: 'var(--primary)' }}
              >
                {BASE_URL}/{data.url?.shortCode}
                <ExternalLink size={14} />
              </a>
              <p className="text-sm mt-1 truncate max-w-md" style={{ color: 'var(--text-muted)' }}>
                {data.url?.originalUrl}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              <span>Created {formatDate(data.url?.createdAt)}</span>
              {data.url?.expiresAt && <span>· Expires {formatDate(data.url?.expiresAt)}</span>}
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={MousePointer} label="Total Clicks" value={data.totalClicks?.toLocaleString() ?? 0} {...kpiColors.indigo} delay={0} />
          <KPICard icon={TrendingUp} label="Clicks Today" value={data.clicksToday ?? 0} {...kpiColors.cyan} delay={0.06} />
          <KPICard icon={Calendar} label="This Week" value={data.clicksThisWeek ?? 0} {...kpiColors.green} delay={0.12} />
          <KPICard icon={Globe} label="Top Country" value={data.topCountries?.[0]?.country || 'N/A'} {...kpiColors.amber} delay={0.18} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-3 p-5" style={cardStyle}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Click Trend (Last 7 Days)</h3>
            <ClickTrendChart data={data.clickTrend} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="lg:col-span-2 p-5" style={cardStyle}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Device Breakdown</h3>
            <DeviceBreakdown data={data.deviceBreakdown} />
          </motion.div>
        </div>

        {/* Countries + Recent visits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="p-5" style={cardStyle}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Countries</h3>
            {data.topCountries?.length ? (
              <div className="space-y-2.5">
                {data.topCountries.slice(0, 8).map((c, i) => {
                  const maxClicks = data.topCountries[0]?.clicks || 1;
                  const pct = Math.round((c.clicks / maxClicks) * 100);
                  return (
                    <div key={c.country} className="flex items-center gap-3">
                      <span className="text-xs w-4 text-right" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                      <span className="text-sm min-w-[80px]" style={{ color: 'var(--text-primary)' }}>{c.country}</span>
                      <div className="flex-1 rounded-full h-1.5" style={{ background: 'var(--border)' }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right" style={{ color: 'var(--text-secondary)' }}>{c.clicks}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No country data yet</p>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="p-5" style={cardStyle}>
            <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Visits</h3>
            {data.recentVisits?.length ? (
              <div className="space-y-2">
                {data.recentVisits.slice(0, 8).map((v, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface)', color: 'var(--text-muted)' }}>
                        <Globe size={13} />
                      </div>
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{v.country || 'Unknown'}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.device} · {v.browser}</p>
                      </div>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatRelativeTime(v.timestamp)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No visits recorded yet</p>
            )}
          </motion.div>
        </div>
      </div>
    );

    // ── Overview analytics ──
    if (overview) return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={MousePointer} label="Total Clicks" value={(overview.totalClicks || 0).toLocaleString()} {...kpiColors.indigo} delay={0} />
          <KPICard icon={TrendingUp} label="Clicks Today" value={overview.clicksToday ?? 0} {...kpiColors.cyan} delay={0.06} />
          <KPICard icon={Calendar} label="This Week" value={overview.clicksThisWeek ?? 0} {...kpiColors.green} delay={0.12} />
          <KPICard icon={Globe} label="Top Country" value={overview.topCountry || 'N/A'} {...kpiColors.amber} delay={0.18} />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="p-5" style={cardStyle}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Click Trend (Last 7 Days)</h3>
          <ClickTrendChart data={overview.clickTrend} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="p-5" style={cardStyle}>
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Top Performing Links</h3>
          {overview.topUrls?.length ? (
            <div className="space-y-3">
              {overview.topUrls.map((u, i) => {
                const maxClicks = overview.topUrls[0]?.clickCount || 1;
                const pct = Math.round((u.clickCount / maxClicks) * 100);
                return (
                  <div key={u.id} className="flex items-center gap-4">
                    <span className="text-xs w-4 text-right" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                    <a href={u.shortUrl} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-mono hover:underline min-w-[100px]" style={{ color: 'var(--primary)' }}>
                      {u.shortCode}
                    </a>
                    <div className="flex-1 rounded-full h-2" style={{ background: 'var(--border)' }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
                    </div>
                    <span className="text-sm font-bold w-12 text-right" style={{ color: 'var(--text-primary)' }}>
                      {u.clickCount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No clicks recorded yet</p>
          )}
        </motion.div>
      </div>
    );

    return null;
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="px-6 py-8">
          {/* Header */}
          <div className="mb-7 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              {urlId && (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 text-sm transition-colors group"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                </Link>
              )}
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {urlId ? 'Link Analytics' : 'Overview Analytics'}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {urlId ? 'Detailed click breakdown for this link.' : 'Performance across all your links.'}
                </p>
              </div>
            </div>

            {/* Export button — only shown when data is loaded */}
            {!loading && !error && (data || overview) && (
              <ExportMenu
                isDark={isDark}
                onCSV={() => exportCSV(data || overview, urlId)}
                onJSON={() => exportJSON(data, overview, urlId)}
              />
            )}
          </div>

          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
