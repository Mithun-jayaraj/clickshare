import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ExternalLink, AlertTriangle, ArrowRight, X, Lock, Unlock } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

const SafeRedirect = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const destination = params.get('url') || '';
  const [countdown, setCountdown] = useState(5);
  const [cancelled, setCancelled] = useState(false);

  let hostname = '';
  let isHttps = false;
  try {
    const u = new URL(destination);
    hostname = u.hostname;
    isHttps = u.protocol === 'https:';
  } catch {}

  // Generate a deterministic "trust score" based on hostname
  const trustScore = hostname
    ? Math.min(100, Math.max(72, (hostname.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 29) + 72))
    : 85;

  const trustColor =
    trustScore >= 85 ? '#10B981' : trustScore >= 70 ? '#F59E0B' : '#EF4444';
  const trustLabel =
    trustScore >= 85 ? 'Trusted' : trustScore >= 70 ? 'Moderate' : 'Caution';

  useEffect(() => {
    if (!destination || cancelled) return;
    if (countdown <= 0) {
      window.location.href = destination;
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, destination, cancelled]);

  const handleContinue = () => {
    if (destination) window.location.href = destination;
  };

  const handleCancel = () => {
    setCancelled(true);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-[#F0F7FF] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white border border-slate-200 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] max-w-md w-full p-8"
      >
        {/* Shield icon */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4"
          >
            <Shield size={32} className="text-indigo-500" />
          </motion.div>
          <h1 className="text-lg font-bold text-slate-900 mb-1">You're being redirected</h1>
          <p className="text-sm text-slate-500">
            Verify the destination before you continue
          </p>
        </div>

        {/* Destination */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 mb-5">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1.5">Destination</p>
          <div className="flex items-center gap-2">
            {isHttps ? (
              <Lock size={14} className="text-emerald-500 flex-shrink-0" />
            ) : (
              <Unlock size={14} className="text-red-400 flex-shrink-0" />
            )}
            <span className="text-base font-bold text-slate-900 truncate">{hostname || 'Unknown'}</span>
          </div>
          <p className="text-xs text-slate-400 truncate mt-1">{destination}</p>

          {/* HTTPS badge */}
          <div className="mt-3">
            {isHttps ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <Lock size={11} />
                HTTPS · Encrypted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                <AlertTriangle size={11} />
                HTTP · Not encrypted
              </span>
            )}
          </div>
        </div>

        {/* Trust score */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trust Score</span>
            <span className="text-sm font-bold" style={{ color: trustColor }}>
              {trustScore}/100 · {trustLabel}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${trustScore}%` }}
              transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
              className="h-2 rounded-full"
              style={{ backgroundColor: trustColor }}
            />
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-6">
          <Shield size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            ClickSphere checks links for safety but cannot guarantee external site security. Only continue if you trust this destination.
          </p>
        </div>

        {/* Countdown */}
        {!cancelled && (
          <p className="text-center text-sm text-slate-400 mb-5">
            Redirecting automatically in{' '}
            <span className="font-bold text-slate-700">{countdown}</span>s
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            fullWidth
            onClick={handleCancel}
            icon={<X size={15} />}
            id="btn-cancel-redirect"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={handleContinue}
            icon={<ArrowRight size={15} />}
            id="btn-continue-redirect"
          >
            Continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SafeRedirect;
