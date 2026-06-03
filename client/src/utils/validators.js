/**
 * Frontend validation utilities
 */

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidUrl = (url) => {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidAlias = (alias) => {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(alias);
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };

  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  const levels = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Very Weak', color: '#EF4444' },
    { score: 2, label: 'Weak', color: '#F59E0B' },
    { score: 3, label: 'Fair', color: '#F59E0B' },
    { score: 4, label: 'Strong', color: '#10B981' },
    { score: 5, label: 'Very Strong', color: '#10B981' },
  ];

  return levels[score] || levels[0];
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateString);
};

export const truncateUrl = (url, maxLength = 50) => {
  if (!url) return '';
  try {
    const { hostname, pathname } = new URL(url);
    const display = hostname + pathname;
    return display.length > maxLength ? display.slice(0, maxLength) + '...' : display;
  } catch {
    return url.length > maxLength ? url.slice(0, maxLength) + '...' : url;
  }
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    return true;
  }
};
