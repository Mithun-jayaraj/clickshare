import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Check, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import useAuth from '../hooks/useAuth.js';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import { isValidEmail, getPasswordStrength } from '../utils/validators.js';

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.password);

  const validate = (fields = form) => {
    const e = {};
    if (!fields.name || fields.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!fields.email) e.email = 'Email is required';
    else if (!isValidEmail(fields.email)) e.email = 'Please enter a valid email';
    if (!fields.password || fields.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (fields.password !== fields.confirmPassword) e.confirmPassword = 'Passwords do not match';
    return e;
  };

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setForm((p) => ({ ...p, [field]: val }));
    if (touched[field]) {
      const errs = validate({ ...form, [field]: val });
      setErrors((p) => ({ ...p, [field]: errs[field] || '' }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((p) => ({ ...p, [field]: true }));
    const errs = validate(form);
    setErrors((p) => ({ ...p, [field]: errs[field] || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email,
        password: form.password,
      });
      login(data.user, data.token);
      toast.success(`Welcome to ClickSphere, ${data.user.name}! 🎉`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isFieldValid = (field) => touched[field] && !errors[field] && form[field];

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 600 600" fill="none">
          <circle cx="300" cy="300" r="250" stroke="white" strokeWidth="1" />
          <circle cx="300" cy="300" r="180" stroke="white" strokeWidth="1" />
          <circle cx="300" cy="300" r="110" stroke="white" strokeWidth="1" />
          <line x1="50" y1="50" x2="550" y2="550" stroke="white" strokeWidth="1" />
          <line x1="550" y1="50" x2="50" y2="550" stroke="white" strokeWidth="1" />
          <line x1="300" y1="50" x2="300" y2="550" stroke="white" strokeWidth="1" />
          <line x1="50" y1="300" x2="550" y2="300" stroke="white" strokeWidth="1" />
          <polygon points="300,100 500,400 100,400" stroke="white" strokeWidth="1" fill="none" />
        </svg>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Zap size={24} fill="white" className="text-white" />
            </div>
            <span className="text-3xl font-extrabold text-white">ClickSphere</span>
          </div>
          <p className="text-indigo-200 text-lg mb-10">The Intelligence Layer For Every Link</p>
          <div className="flex flex-col gap-3">
            {['Free to get started', 'No credit card needed', 'Powerful analytics included'].map((item) => (
              <div key={item} className="flex items-center gap-3 bg-white/15 text-white text-sm font-medium px-5 py-3 rounded-xl border border-white/20">
                <Check size={16} className="text-white/80 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <Zap size={16} fill="white" className="text-white" />
            </div>
            <span className="font-bold text-slate-900">ClickSphere</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
            <p className="text-slate-500 text-sm">Start tracking your links in under a minute</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Name */}
            <div className="relative">
              <Input
                id="signup-name"
                label="Full name"
                type="text"
                placeholder="Jane Doe"
                value={form.name}
                onChange={handleChange('name')}
                onBlur={handleBlur('name')}
                error={errors.name}
                required
                autoComplete="name"
              />
              <AnimatePresence>
                {isFieldValid('name') && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute right-3 top-8 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Email */}
            <div className="relative">
              <Input
                id="signup-email"
                label="Email address"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange('email')}
                onBlur={handleBlur('email')}
                error={errors.email}
                required
                autoComplete="email"
              />
              <AnimatePresence>
                {isFieldValid('email') && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute right-3 top-8 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password + strength */}
            <div>
              <Input
                id="signup-password"
                label="Password"
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                error={errors.password}
                required
                autoComplete="new-password"
              />
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i <= strength.score ? strength.color : '#E2E8F0',
                        }}
                      />
                    ))}
                  </div>
                  {strength.label && (
                    <p className="text-xs font-medium" style={{ color: strength.color }}>
                      {strength.label}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="relative">
              <Input
                id="signup-confirm-password"
                label="Confirm password"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />
              <AnimatePresence>
                {isFieldValid('confirmPassword') && form.password === form.confirmPassword && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute right-3 top-8 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
                  >
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              size="lg"
              icon={<UserPlus size={16} />}
              id="btn-create-account"
              className="mt-2"
            >
              Create Account
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-4">
            By signing up, you agree to our{' '}
            <a href="#" className="text-indigo-500 hover:underline">Terms</a> and{' '}
            <a href="#" className="text-indigo-500 hover:underline">Privacy Policy</a>.
          </p>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-500 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;
