import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Zap,
  LayoutDashboard,
  Link2,
  BarChart2,
  User,
  Settings,
  LogOut,
  Plus,
  Users,
  Sun,
  Moon,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth.js';
import { useTheme } from '../../context/ThemeContext.jsx';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'My Links', icon: Link2, href: '/dashboard/links' },
  { label: 'Analytics', icon: BarChart2, href: '/dashboard/analytics' },
  { label: 'Team Workspace', icon: Users, href: '/dashboard/workspace' },
  { label: 'Profile', icon: User, href: '/dashboard/profile' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
];

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const isActive = (href) => {
    if (href === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(href);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <Zap size={16} fill="white" className="text-white" />
          </div>
          <span className="logo-text text-base font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            ClickSphere
          </span>
        </Link>
      </div>

      {/* Create link button */}
      <div className="px-3 py-4">
        <Link to="/dashboard/create">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2.5 bg-indigo-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-600 transition-colors"
          >
            <Plus size={16} />
            <span className="sidebar-label">New Link</span>
          </motion.div>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} to={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative ${
                  active
                    ? 'text-indigo-500'
                    : 'hover:text-slate-900'
                }`}
                style={{
                  backgroundColor: active ? (isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff') : 'transparent',
                  color: active ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg"
                    style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : '#eef2ff' }}
                    transition={{ duration: 0.2 }}
                  />
                )}
                <Icon size={18} className="flex-shrink-0 relative z-10" />
                <span className="sidebar-label text-sm font-medium relative z-10">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Dark mode toggle */}
      <div className="px-3 pb-2">
        <button
          onClick={toggleTheme}
          id="btn-toggle-theme"
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-sm font-medium"
          style={{
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          {isDark ? <Sun size={17} className="flex-shrink-0" /> : <Moon size={17} className="flex-shrink-0" />}
          <span className="sidebar-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* User + logout */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff' }}
          >
            <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
              {getInitials(user?.name)}
            </span>
          </div>
          <div className="user-info min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {user?.name}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
              {user?.email}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-sm font-medium"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2';
            e.currentTarget.style.color = 'var(--danger)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <LogOut size={17} className="flex-shrink-0" />
          <span className="logout-text">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
