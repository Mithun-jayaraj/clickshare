import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Link2,
  BarChart2,
  Plus,
  Copy,
  Trash2,
  QrCode,
  TrendingUp,
  Clock,
  CheckCircle2,
  ExternalLink,
  Search,
  Bell,
  LayoutDashboard,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import useAuth from '../hooks/useAuth.js';
import useUrls from '../hooks/useUrls.js';
import Sidebar from '../components/layout/Sidebar.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { copyToClipboard, truncateUrl, formatRelativeTime } from '../utils/validators.js';

const BASE_URL = (import.meta.env.VITE_BASE_URL || 'http://localhost:5000').trim().replace(/\/+$/, '');

// Animated counter
const Counter = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (end === 0) return;
    const duration = 800;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
};

// Skeleton row
const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-4 px-5 border-b border-slate-50">
    {[120, 80, 60, 40, 100].map((w, i) => (
      <div key={i} className="skeleton h-4 rounded" style={{ width: w }} />
    ))}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { urls, loading, fetchUrls, deleteUrl } = useUrls();
  const [search, setSearch] = useState('');
  const [qrUrl, setQrUrl] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { fetchUrls(); }, [fetchUrls]);

  const handleCopy = useCallback(async (shortCode) => {
    const url = `${BASE_URL}/${shortCode}`;
    await copyToClipboard(url);
    toast.success('Link copied to clipboard!');
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteUrl(deleteTarget._id);
    setDeleteTarget(null);
  };

  const filtered = urls.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.originalUrl.toLowerCase().includes(q) ||
      u.shortCode.toLowerCase().includes(q)
    );
  });

  // Stats
  const totalClicks = urls.reduce((s, u) => s + u.clickCount, 0);
  const activeLinks = urls.filter((u) => u.isActive).length;
  const expiredLinks = urls.filter((u) => u.expiresAt && new Date() > new Date(u.expiresAt)).length;

  const statCards = [
    { label: 'Total Links', value: urls.length, icon: Link2, color: 'bg-indigo-50 text-indigo-500' },
    { label: 'Total Clicks', value: totalClicks, icon: TrendingUp, color: 'bg-cyan-50 text-cyan-500' },
    { label: 'Active Links', value: activeLinks, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-500' },
    { label: 'Expired Links', value: expiredLinks, icon: Clock, color: 'bg-amber-50 text-amber-500' },
  ];

  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  };

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        {/* Top Bar */}
        <div
          className="sticky top-0 z-40 px-6 py-3 flex items-center gap-4"
          style={{
            background: 'var(--card)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div className="flex-1 relative max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search links..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-all"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--text-primary)',
              }}
              id="search-links"
            />
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
              id="btn-notifications"
              onClick={() => toast('Notifications coming soon!')}
            >
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xs font-bold text-indigo-600">{getInitials(user?.name)}</span>
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:block">{user?.name}</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl font-bold text-slate-900">
              Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 text-sm mt-1">Here's what's happening with your links today.</p>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.07)' }}
                  className="bg-white border border-slate-200 rounded-xl p-5"
                >
                  <div className={`w-9 h-9 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                    <Icon size={18} />
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mb-0.5">
                    <Counter value={card.value} />
                  </p>
                  <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* URL Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            {/* Table header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">My Links</h2>
                <p className="text-xs text-slate-400 mt-0.5">{urls.length} total link{urls.length !== 1 ? 's' : ''}</p>
              </div>
              <Link to="/dashboard/create">
                <Button variant="primary" size="sm" icon={<Plus size={14} />} id="btn-create-link-table">
                  Create Link
                </Button>
              </Link>
            </div>

            {/* Table content */}
            {loading ? (
              <div>
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                  <Link2 size={28} className="text-indigo-400" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">
                  {search ? 'No links found' : 'No links yet'}
                </h3>
                <p className="text-sm text-slate-400 mb-5">
                  {search
                    ? 'Try a different search term.'
                    : 'Create your first short link to get started.'}
                </p>
                {!search && (
                  <Link to="/dashboard/create">
                    <Button variant="primary" size="sm" icon={<Plus size={14} />} id="btn-create-first-link">
                      Create Your First Link
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Column headers */}
                <div className="grid grid-cols-[2fr_1.5fr_1fr_0.7fr_auto] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <span>Original URL</span>
                  <span>Short URL</span>
                  <span>Created</span>
                  <span>Clicks</span>
                  <span>Actions</span>
                </div>
                {filtered.map((url, i) => {
                  const shortUrl = `${BASE_URL}/${url.shortCode}`;
                  const isExpired = url.expiresAt && new Date() > new Date(url.expiresAt);
                  return (
                    <motion.div
                      key={url._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="grid grid-cols-[2fr_1.5fr_1fr_0.7fr_auto] gap-4 items-center px-5 py-3.5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* Original URL */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm text-slate-700 truncate font-medium">
                            {truncateUrl(url.originalUrl, 45)}
                          </p>
                          {isExpired && (
                            <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium border border-red-100 flex-shrink-0">
                              Expired
                            </span>
                          )}
                          {!url.isActive && !isExpired && (
                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium border border-slate-200 flex-shrink-0">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Short URL */}
                      <div>
                        <a
                          href={shortUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-cyan-500 font-medium font-mono flex items-center gap-1 hover:text-cyan-600 transition-colors"
                        >
                          {url.shortCode}
                          <ExternalLink size={11} className="flex-shrink-0" />
                        </a>
                      </div>

                      {/* Created */}
                      <div className="text-xs text-slate-400">{formatRelativeTime(url.createdAt)}</div>

                      {/* Clicks */}
                      <div>
                        <span className="text-sm font-semibold text-slate-700">
                          {url.clickCount.toLocaleString()}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(url.shortCode)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                          title="Copy link"
                          id={`btn-copy-${url._id}`}
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          onClick={() => setQrUrl(url)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-50 transition-colors"
                          title="QR Code"
                          id={`btn-qr-${url._id}`}
                        >
                          <QrCode size={15} />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/analytics/${url._id}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                          title="Analytics"
                          id={`btn-analytics-${url._id}`}
                        >
                          <BarChart2 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(url)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                          id={`btn-delete-${url._id}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {[
          { icon: LayoutDashboard, label: 'Home', to: '/dashboard' },
          { icon: Link2, label: 'Links', to: '/dashboard/links' },
          { icon: Plus, label: '', to: '/dashboard/create', special: true },
          { icon: BarChart2, label: 'Analytics', to: '/dashboard/analytics' },
          { icon: User, label: 'Profile', to: '/dashboard/profile' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-1 flex-col items-center justify-center py-1.5 gap-0.5"
          >
            {item.special ? (
              <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
            ) : (
              <>
                <item.icon size={20} className="text-slate-500" />
                <span className="text-xs text-slate-500">{item.label}</span>
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* QR Modal */}
      <Modal isOpen={!!qrUrl} onClose={() => setQrUrl(null)} title="QR Code">
        {qrUrl && (
          <div className="text-center py-4">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200">
                <QRCodeSVG value={`${BASE_URL}/${qrUrl.shortCode}`} size={200} />
              </div>
            </div>
            <p className="text-sm font-mono text-indigo-600 mb-1">{`${BASE_URL}/${qrUrl.shortCode}`}</p>
            <p className="text-xs text-slate-400 mb-4 truncate">{truncateUrl(qrUrl.originalUrl, 40)}</p>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              id="btn-copy-qr-url"
              onClick={() => {
                copyToClipboard(`${BASE_URL}/${qrUrl.shortCode}`);
                toast.success('Copied!');
              }}
            >
              Copy Link
            </Button>
          </div>
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Link">
        <div>
          <p className="text-slate-600 text-sm mb-2">
            Are you sure you want to delete this link? This action cannot be undone and all click
            data will be lost.
          </p>
          {deleteTarget && (
            <p className="text-xs font-mono bg-slate-50 p-2 rounded-lg text-slate-500 mb-5 truncate border border-slate-200">
              {BASE_URL}/{deleteTarget.shortCode}
            </p>
          )}
          <div className="flex gap-3">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => setDeleteTarget(null)}
              id="btn-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDelete}
              id="btn-confirm-delete"
            >
              Delete Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
