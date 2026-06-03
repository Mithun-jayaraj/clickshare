import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, Copy, Check, RefreshCw, Trash2, UserMinus,
  Crown, Shield, Eye, LogIn, X, ChevronDown, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import Sidebar from '../components/layout/Sidebar.jsx';
import Button from '../components/ui/Button.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import useAuth from '../hooks/useAuth.js';

// ── Role badge ──────────────────────────────────────────────
const roleMeta = {
  owner:  { label: 'Owner',  icon: Crown,  color: 'amber'  },
  admin:  { label: 'Admin',  icon: Shield, color: 'indigo' },
  editor: { label: 'Editor', icon: Zap,    color: 'cyan'   },
  viewer: { label: 'Viewer', icon: Eye,    color: 'slate'  },
};

const RoleBadge = ({ role }) => {
  const meta = roleMeta[role] || roleMeta.viewer;
  const Icon = meta.icon;
  const colors = {
    amber:  { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    indigo: { bg: '#eef2ff', text: '#6366f1', border: '#c7d2fe' },
    cyan:   { bg: '#ecfeff', text: '#06b6d4', border: '#a5f3fc' },
    slate:  { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
  };
  const c = colors[meta.color];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      <Icon size={10} />
      {meta.label}
    </span>
  );
};

// ── Modal ────────────────────────────────────────────────────
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-md rounded-2xl p-6"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{title}</h2>
            <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ── Invite copy row ──────────────────────────────────────────
const InviteRow = ({ inviteCode, workspaceId, onRegenerate }) => {
  const [copied, setCopied] = useState(false);
  const [regen, setRegen] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerate = async () => {
    setRegen(true);
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/regenerate-invite`);
      onRegenerate(workspaceId, data.inviteCode);
      toast.success('New invite code generated!');
    } catch {
      toast.error('Failed to regenerate invite code');
    } finally {
      setRegen(false);
    }
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <code className="flex-1 text-xs font-mono" style={{ color: 'var(--primary)' }}>
        {inviteCode}
      </code>
      <button
        onClick={copy}
        className="p-1.5 rounded-lg transition-colors"
        title="Copy code"
        style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <button
        onClick={regenerate}
        className="p-1.5 rounded-lg transition-colors"
        title="Regenerate"
        style={{ color: 'var(--text-muted)' }}
        disabled={regen}
      >
        <RefreshCw size={14} className={regen ? 'animate-spin' : ''} />
      </button>
    </div>
  );
};

// ── Main Workspace page ──────────────────────────────────────
const Workspace = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/workspaces');
      setWorkspaces(data.workspaces);
      if (data.workspaces.length && !activeId) {
        setActiveId(data.workspaces[0]._id);
      }
    } catch {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => { fetchWorkspaces(); }, []);

  const activeWorkspace = workspaces.find((w) => w._id === activeId);
  const isOwner = activeWorkspace?.owner?._id === user?._id || activeWorkspace?.owner === user?._id;

  // Create workspace
  const handleCreate = async () => {
    if (!createForm.name.trim()) return toast.error('Name is required');
    setSubmitting(true);
    try {
      const { data } = await api.post('/workspaces', createForm);
      setWorkspaces((p) => [data.workspace, ...p]);
      setActiveId(data.workspace._id);
      setCreateOpen(false);
      setCreateForm({ name: '', description: '' });
      toast.success('Workspace created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setSubmitting(false);
    }
  };

  // Join workspace
  const handleJoin = async () => {
    if (!joinCode.trim()) return toast.error('Enter an invite code');
    setSubmitting(true);
    try {
      const { data } = await api.post('/workspaces/join', { inviteCode: joinCode.trim() });
      setWorkspaces((p) => [...p, data.workspace]);
      setActiveId(data.workspace._id);
      setJoinOpen(false);
      setJoinCode('');
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete workspace
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this workspace? This cannot be undone.')) return;
    try {
      await api.delete(`/workspaces/${id}`);
      const remaining = workspaces.filter((w) => w._id !== id);
      setWorkspaces(remaining);
      setActiveId(remaining[0]?._id || null);
      toast.success('Workspace deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  // Remove member
  const handleRemoveMember = async (workspaceId, memberId) => {
    try {
      await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      setWorkspaces((prev) =>
        prev.map((w) =>
          w._id === workspaceId
            ? { ...w, members: w.members.filter((m) => (m.user?._id || m.user) !== memberId) }
            : w
        )
      );
      toast.success('Member removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  // Change role
  const handleRoleChange = async (workspaceId, memberId, newRole) => {
    try {
      await api.patch(`/workspaces/${workspaceId}/members/${memberId}/role`, { role: newRole });
      setWorkspaces((prev) =>
        prev.map((w) =>
          w._id === workspaceId
            ? {
                ...w,
                members: w.members.map((m) =>
                  (m.user?._id || m.user) === memberId ? { ...m, role: newRole } : m
                ),
              }
            : w
        )
      );
      toast.success(`Role updated to ${newRole}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  // Regenerate invite
  const handleRegenerate = (workspaceId, newCode) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w._id === workspaceId ? { ...w, inviteCode: newCode } : w))
    );
  };

  const cardStyle = {
    background: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    boxShadow: 'var(--shadow-card)',
  };

  const inputStyle = {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1.5px solid var(--border)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.15s ease',
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="px-6 py-8 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-7 flex-wrap gap-4"
          >
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Team Workspaces
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                Collaborate with your team — share links, manage members and roles.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                icon={<LogIn size={15} />}
                onClick={() => setJoinOpen(true)}
                id="btn-join-workspace"
              >
                Join Workspace
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={15} />}
                onClick={() => setCreateOpen(true)}
                id="btn-create-workspace"
              >
                New Workspace
              </Button>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-32">
              <Spinner size="lg" color="indigo" />
            </div>
          ) : workspaces.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
              style={cardStyle}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff' }}
              >
                <Users size={28} style={{ color: 'var(--primary)' }} />
              </div>
              <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                No workspaces yet
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                Create a new workspace or join one with an invite code.
              </p>
              <div className="flex justify-center gap-3">
                <Button variant="ghost" onClick={() => setJoinOpen(true)} id="btn-join-ws-empty">
                  Join with Code
                </Button>
                <Button variant="primary" onClick={() => setCreateOpen(true)} id="btn-create-ws-empty">
                  Create Workspace
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="flex gap-5">
              {/* Sidebar list */}
              <div className="w-56 flex-shrink-0 space-y-1">
                {workspaces.map((w) => {
                  const myRole = w.owner?._id === user?._id || w.owner === user?._id
                    ? 'owner'
                    : w.members.find((m) => (m.user?._id || m.user) === user?._id)?.role || 'viewer';
                  return (
                    <button
                      key={w._id}
                      onClick={() => setActiveId(w._id)}
                      className="w-full text-left px-3 py-3 rounded-xl transition-all"
                      style={{
                        background: activeId === w._id
                          ? (isDark ? 'rgba(99,102,241,0.18)' : '#eef2ff')
                          : 'transparent',
                        border: activeId === w._id ? '1.5px solid var(--primary)' : '1.5px solid transparent',
                        color: activeId === w._id ? 'var(--primary)' : 'var(--text-secondary)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{
                            background: isDark ? 'rgba(99,102,241,0.25)' : '#e0e7ff',
                            color: 'var(--primary)',
                          }}
                        >
                          {w.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{w.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {(w.members?.length || 0) + 1} member{(w.members?.length || 0) !== 0 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Workspace detail */}
              {activeWorkspace && (
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex-1 space-y-5"
                >
                  {/* Workspace info card */}
                  <div className="p-5" style={cardStyle}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>
                          {activeWorkspace.name}
                        </h2>
                        {activeWorkspace.description && (
                          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {activeWorkspace.description}
                          </p>
                        )}
                        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                          Owned by{' '}
                          <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                            {activeWorkspace.owner?.name}
                          </span>{' '}
                          · {(activeWorkspace.members?.length || 0) + 1} members
                        </p>
                      </div>
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(activeWorkspace._id)}
                          className="p-2 rounded-lg transition-colors"
                          style={{ color: 'var(--danger)' }}
                          title="Delete workspace"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* Invite code */}
                    {isOwner && (
                      <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                          Invite Code
                        </p>
                        <InviteRow
                          inviteCode={activeWorkspace.inviteCode}
                          workspaceId={activeWorkspace._id}
                          onRegenerate={handleRegenerate}
                        />
                        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                          Share this code with teammates so they can join.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Members list */}
                  <div className="p-5" style={cardStyle}>
                    <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                      Members ({(activeWorkspace.members?.length || 0) + 1})
                    </h3>
                    <div className="space-y-3">
                      {/* Owner row */}
                      <div
                        className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                        style={{ background: 'var(--surface)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{ background: isDark ? 'rgba(245,158,11,0.2)' : '#fef3c7', color: '#d97706' }}
                          >
                            {activeWorkspace.owner?.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                              {activeWorkspace.owner?.name}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {activeWorkspace.owner?.email}
                            </p>
                          </div>
                        </div>
                        <RoleBadge role="owner" />
                      </div>

                      {/* Member rows */}
                      {activeWorkspace.members?.map((m) => {
                        const memberId = m.user?._id || m.user;
                        const memberName = m.user?.name || 'Unknown';
                        const memberEmail = m.user?.email || '';
                        const myId = user?._id;
                        const canManage = isOwner;

                        return (
                          <div
                            key={memberId}
                            className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                            style={{ background: 'var(--surface)' }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm"
                                style={{
                                  background: isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff',
                                  color: 'var(--primary)',
                                }}
                              >
                                {memberName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                  {memberName}
                                  {memberId === myId && (
                                    <span className="ml-1.5 text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                                      (you)
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                  {memberEmail}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {canManage ? (
                                <div className="relative">
                                  <select
                                    value={m.role}
                                    onChange={(e) => handleRoleChange(activeWorkspace._id, memberId, e.target.value)}
                                    className="text-xs pr-6 pl-2 py-1 rounded-lg appearance-none cursor-pointer"
                                    style={{
                                      background: 'var(--card)',
                                      border: '1px solid var(--border)',
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                    <option value="viewer">Viewer</option>
                                  </select>
                                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                                </div>
                              ) : (
                                <RoleBadge role={m.role} />
                              )}
                              {(canManage || memberId === myId) && (
                                <button
                                  onClick={() => handleRemoveMember(activeWorkspace._id, memberId)}
                                  className="p-1.5 rounded-lg transition-colors"
                                  style={{ color: 'var(--text-muted)' }}
                                  title={memberId === myId ? 'Leave workspace' : 'Remove member'}
                                >
                                  <UserMinus size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create workspace modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Workspace">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Workspace Name *
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Marketing Team"
              style={inputStyle}
              id="input-workspace-name"
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Description (optional)
            </label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What is this workspace for?"
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              id="input-workspace-desc"
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" fullWidth onClick={() => setCreateOpen(false)} id="btn-cancel-create-ws">
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={submitting}
              onClick={handleCreate}
              id="btn-confirm-create-ws"
            >
              Create Workspace
            </Button>
          </div>
        </div>
      </Modal>

      {/* Join workspace modal */}
      <Modal isOpen={joinOpen} onClose={() => setJoinOpen(false)} title="Join Workspace">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ask your team admin for the invite code, then enter it below to join.
          </p>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Invite Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g. aBcDe12345"
              style={inputStyle}
              id="input-invite-code"
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" fullWidth onClick={() => setJoinOpen(false)} id="btn-cancel-join-ws">
              Cancel
            </Button>
            <Button
              variant="primary"
              fullWidth
              loading={submitting}
              onClick={handleJoin}
              id="btn-confirm-join-ws"
            >
              Join Workspace
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Workspace;
