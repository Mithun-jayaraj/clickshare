import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Bell, Moon, Globe, Trash2, AlertTriangle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import useAuth from '../hooks/useAuth.js';
import { useTheme } from '../context/ThemeContext.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import Button from '../components/ui/Button.jsx';
import Modal from '../components/ui/Modal.jsx';

const Toggle = ({ checked, onChange, id }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 ${
      checked ? 'bg-indigo-500' : 'bg-slate-200'
    }`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? 'translate-x-4' : 'translate-x-1'
      }`}
    />
  </button>
);

const SettingRow = ({ label, desc, checked, onChange, id }) => (
  <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-0">
    <div>
      <p className="text-sm font-medium text-slate-800">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
    </div>
    <Toggle checked={checked} onChange={onChange} id={id} />
  </div>
);

const Settings = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [confirm, setConfirm] = useState('');

  const [notifs, setNotifs] = useState({
    emailAlerts: true,
    weeklyReport: false,
    linkExpiry: true,
    securityAlerts: true,
  });

  const [prefs, setPrefs] = useState({
    safeRedirect: true,
    trackIp: true,
    publicProfile: false,
  });

  const toggleNotif = (key) => (val) => setNotifs((p) => ({ ...p, [key]: val }));
  const togglePref = (key) => (val) => setPrefs((p) => ({ ...p, [key]: val }));

  const handleDeleteAccount = async () => {
    if (confirm !== 'DELETE') return;
    setDeletingAccount(true);
    try {
      await api.delete('/auth/account');
      logout();
      toast.success('Account deleted successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeletingAccount(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="max-w-xl mx-auto px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage your preferences and account settings</p>
            </div>

            {/* Notification Settings */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <Bell size={17} className="text-indigo-500" />
                <h2 className="font-semibold text-slate-800">Notification Preferences</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">Choose how and when you receive updates.</p>
              <SettingRow
                id="notif-email-alerts"
                label="Email Alerts"
                desc="Get notified by email for important events"
                checked={notifs.emailAlerts}
                onChange={toggleNotif('emailAlerts')}
              />
              <SettingRow
                id="notif-weekly-report"
                label="Weekly Report"
                desc="Receive a weekly summary of your link performance"
                checked={notifs.weeklyReport}
                onChange={toggleNotif('weeklyReport')}
              />
              <SettingRow
                id="notif-link-expiry"
                label="Link Expiry Reminders"
                desc="Get notified 24 hours before a link expires"
                checked={notifs.linkExpiry}
                onChange={toggleNotif('linkExpiry')}
              />
              <SettingRow
                id="notif-security-alerts"
                label="Security Alerts"
                desc="Alerts for unusual login activity on your account"
                checked={notifs.securityAlerts}
                onChange={toggleNotif('securityAlerts')}
              />
            </div>

            {/* Appearance */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <Moon size={17} className="text-indigo-500" />
                <h2 className="font-semibold text-slate-800">Appearance</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">Customize the look and feel of ClickSphere.</p>
              <div className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-slate-800">Dark Mode</p>
                  <p className="text-xs text-slate-400 mt-0.5">Switch between light and dark interface</p>
                </div>
                <Toggle checked={isDark} onChange={toggleTheme} id="toggle-dark-mode" />
              </div>
            </div>

            {/* Account Preferences */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <Globe size={17} className="text-indigo-500" />
                <h2 className="font-semibold text-slate-800">Account Preferences</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">Control your account behavior and privacy.</p>
              <SettingRow
                id="pref-safe-redirect"
                label="Safe Redirect Interstitial"
                desc="Show a preview page before redirecting visitors"
                checked={prefs.safeRedirect}
                onChange={togglePref('safeRedirect')}
              />
              <SettingRow
                id="pref-track-ip"
                label="Track IP Addresses"
                desc="Log visitor IP addresses for analytics"
                checked={prefs.trackIp}
                onChange={togglePref('trackIp')}
              />
              <SettingRow
                id="pref-public-profile"
                label="Public Profile"
                desc="Allow others to see your public profile page"
                checked={prefs.publicProfile}
                onChange={togglePref('publicProfile')}
              />
            </div>

            {/* Danger Zone */}
            <div className="bg-white border border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <AlertTriangle size={17} className="text-red-500" />
                <h2 className="font-semibold text-red-600">Danger Zone</h2>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Permanent and irreversible actions. Please proceed with caution.
              </p>
              <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl px-4 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Delete Account</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  icon={<Trash2 size={14} />}
                  id="btn-open-delete-account"
                >
                  Delete
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Delete Account Modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setConfirm(''); }}
        title="Delete Account"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600">
              This will permanently delete your account, all links, and analytics data. This cannot be undone.
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Type <span className="font-bold text-slate-800">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
              id="input-delete-confirm"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="ghost"
              fullWidth
              onClick={() => { setDeleteOpen(false); setConfirm(''); }}
              id="btn-cancel-delete-account"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              disabled={confirm !== 'DELETE'}
              loading={deletingAccount}
              onClick={handleDeleteAccount}
              id="btn-confirm-delete-account"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
