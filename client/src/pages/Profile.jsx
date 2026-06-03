import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import useAuth from '../hooks/useAuth.js';
import Sidebar from '../components/layout/Sidebar.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { formatDate } from '../utils/validators.js';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [passErrors, setPassErrors] = useState({});
  const [savingPass, setSavingPass] = useState(false);

  const getInitials = (n) => n?.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '?';

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) { setNameError('Name must be at least 2 characters'); return; }
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/profile', { name: name.trim() });
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const e2 = {};
    if (!passwords.current) e2.current = 'Current password required';
    if (passwords.newPass.length < 6) e2.newPass = 'Minimum 6 characters';
    if (passwords.newPass !== passwords.confirm) e2.confirm = 'Passwords do not match';
    setPassErrors(e2);
    if (Object.keys(e2).length) return;

    setSavingPass(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: passwords.current,
        newPassword: passwords.newPass,
      });
      toast.success('Password changed successfully!');
      setPasswords({ current: '', newPass: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed');
    } finally {
      setSavingPass(false);
    }
  };

  const handlePassChange = (field) => (e) => {
    setPasswords((p) => ({ ...p, [field]: e.target.value }));
    if (passErrors[field]) setPassErrors((p) => ({ ...p, [field]: '' }));
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
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage your personal information</p>
            </div>

            {/* Avatar + info */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-indigo-600">{getInitials(user?.name)}</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{user?.name}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <p className="text-xs text-slate-400 mt-1">Member since {formatDate(user?.createdAt)}</p>
              </div>
            </div>

            {/* Edit profile */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <User size={18} className="text-indigo-500" />
                <h2 className="font-semibold text-slate-800">Edit Profile</h2>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input
                  id="profile-name"
                  label="Full name"
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                  error={nameError}
                  required
                />
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                    Email address
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <Mail size={14} className="text-slate-400" />
                    <span className="text-sm text-slate-500">{user?.email}</span>
                    <span className="ml-auto text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">Read-only</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  loading={savingProfile}
                  icon={<Save size={15} />}
                  id="btn-save-profile"
                >
                  Save Changes
                </Button>
              </form>
            </div>

            {/* Change password */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <Lock size={18} className="text-indigo-500" />
                <h2 className="font-semibold text-slate-800">Change Password</h2>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <Input
                  id="current-password"
                  label="Current password"
                  type="password"
                  value={passwords.current}
                  onChange={handlePassChange('current')}
                  error={passErrors.current}
                  required
                  autoComplete="current-password"
                />
                <Input
                  id="new-password"
                  label="New password"
                  type="password"
                  value={passwords.newPass}
                  onChange={handlePassChange('newPass')}
                  error={passErrors.newPass}
                  required
                  autoComplete="new-password"
                />
                <Input
                  id="confirm-new-password"
                  label="Confirm new password"
                  type="password"
                  value={passwords.confirm}
                  onChange={handlePassChange('confirm')}
                  error={passErrors.confirm}
                  required
                  autoComplete="new-password"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  loading={savingPass}
                  icon={<Lock size={15} />}
                  id="btn-update-password"
                >
                  Update Password
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
