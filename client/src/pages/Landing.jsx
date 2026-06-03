import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  BarChart2,
  QrCode,
  Link2,
  Clock,
  Shield,
  Zap,
  ArrowRight,
  Play,
  Check,
  Globe,
  Star,
} from 'lucide-react';
import Navbar from '../components/layout/Navbar.jsx';
import Footer from '../components/layout/Footer.jsx';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

const features = [
  {
    icon: BarChart2,
    title: 'Deep Analytics',
    desc: 'Track clicks, devices, browsers, and countries in real-time.',
    color: 'text-indigo-500 bg-indigo-50',
  },
  {
    icon: QrCode,
    title: 'QR Codes',
    desc: 'Auto-generate QR codes for every shortened link instantly.',
    color: 'text-cyan-500 bg-cyan-50',
  },
  {
    icon: Link2,
    title: 'Custom Alias',
    desc: 'Personalize your links with memorable branded short codes.',
    color: 'text-emerald-500 bg-emerald-50',
  },
  {
    icon: Clock,
    title: 'Expiry Links',
    desc: 'Set expiration dates — perfect for time-sensitive campaigns.',
    color: 'text-amber-500 bg-amber-50',
  },
  {
    icon: Shield,
    title: 'Safe Redirect',
    desc: 'Preview destination with trust scores before redirecting.',
    color: 'text-purple-500 bg-purple-50',
  },
  {
    icon: Zap,
    title: 'Fast Engine',
    desc: 'Sub-millisecond redirects powered by optimized MongoDB indexing.',
    color: 'text-red-500 bg-red-50',
  },
];

const stats = [
  { value: '50K+', label: 'Links Created' },
  { value: '1M+', label: 'Clicks Tracked' },
  { value: '99.9%', label: 'Uptime' },
  { value: '80+', label: 'Countries' },
];

const steps = [
  { num: '01', title: 'Paste Your URL', desc: 'Drop any long URL into the input field.' },
  { num: '02', title: 'Generate Short Link', desc: 'Get a compact, shareable link in seconds.' },
  { num: '03', title: 'Track Analytics', desc: 'Watch clicks roll in and analyze your audience.' },
];

const testimonials = [
  {
    quote:
      "ClickSphere transformed how we measure our growth campaigns. The analytics are incredible — we finally know which channels drive real traffic.",
    name: 'Sarah Chen',
    role: 'Growth Lead @ Nexus Ventures',
    initials: 'SC',
    rating: 5,
  },
  {
    quote:
      "I switched from Bitly in a day. The custom aliases and expiry links are exactly what our seasonal promotions needed. Clean, fast, and reliable.",
    name: 'Marcus Rodriguez',
    role: 'Marketing Manager @ Prism Labs',
    initials: 'MR',
    rating: 5,
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── HERO ── */}
      <section className="max-w-7xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
          {/* Left — 60% */}
          <motion.div
            className="lg:col-span-3"
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-100 mb-6">
                <Zap size={12} fill="currentColor" />
                Built for modern growth teams
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-[1.08] tracking-tight mb-6"
            >
              Shorten Links.
              <br />
              <span className="text-indigo-500">Track Everything.</span>
              <br />
              Grow Smarter.
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-slate-500 leading-relaxed mb-8 max-w-xl">
              ClickSphere is the intelligence layer for every link — powerful analytics, custom aliases, and QR codes in one clean dashboard.
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap">
              <Link to="/signup">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-indigo-600 transition-colors shadow-[0_4px_14px_rgba(99,102,241,0.25)]"
                >
                  Get Started <ArrowRight size={16} />
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Play size={10} fill="#6366F1" className="text-indigo-500 ml-0.5" />
                </div>
                Watch Demo
              </motion.button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex items-center gap-5 mt-8">
              {['No credit card required', 'Free plan forever', 'Setup in 30s'].map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Check size={13} className="text-emerald-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — 40% — Floating mockup */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
                style={{ animation: 'borderGlow 3s ease-in-out infinite' }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                  <div className="ml-auto text-xs text-slate-400 font-mono">clicksphere.app</div>
                </div>
                <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">Destination URL</p>
                <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-xs text-slate-500 font-mono mb-4 truncate">
                  https://example.com/very/long/campaign-url?utm_source=newsletter&utm_medium=email
                </div>
                <p className="text-xs text-slate-400 font-medium mb-2 uppercase tracking-wider">Custom Alias (optional)</p>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xs text-slate-400 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200 font-mono">cks.to /</span>
                  <div className="flex-1 bg-white border border-indigo-300 rounded-lg px-3 py-2.5 text-xs text-indigo-600 font-mono ring-2 ring-indigo-100">
                    launch2025
                  </div>
                </div>
                <div className="h-9 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">Generate Short Link →</span>
                </div>

                {/* Success state */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.4 }}
                  className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </div>
                    <span className="text-xs font-semibold text-emerald-700">Link created!</span>
                  </div>
                  <p className="text-sm font-bold text-indigo-600 font-mono">cks.to/launch2025</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">0 clicks</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span className="text-xs text-slate-400">No expiry</span>
                  </div>
                </motion.div>
              </motion.div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.3 }}
                className="absolute -bottom-4 -right-4 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 size={16} className="text-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-900">2,847 clicks</p>
                    <p className="text-xs text-emerald-500 font-medium">↑ 23% this week</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-[#F0F7FF] border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</p>
                <p className="text-sm text-slate-500 font-medium mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (Bento Grid) ── */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="section-label block mb-3">Features</span>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need to grow</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            From real-time analytics to expiring links — ClickSphere gives you the tools to understand your audience and optimize every link.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                className="bg-white border border-slate-200 rounded-2xl p-6 transition-shadow duration-200"
              >
                <div className={`w-10 h-10 rounded-xl ${feat.color} flex items-center justify-center mb-4`}>
                  <Icon size={20} />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-[#F0F7FF] border-y border-slate-100 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="section-label block mb-3">How it works</span>
            <h2 className="text-4xl font-bold text-slate-900">Up and running in 3 steps</h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-200 p-7 relative"
              >
                <span className="text-5xl font-black text-slate-100 mb-4 block leading-none">{step.num}</span>
                <h3 className="font-bold text-slate-900 mb-2 text-lg">{step.title}</h3>
                <p className="text-sm text-slate-500">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                    <ArrowRight size={20} className="text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="section-label block mb-3">Testimonials</span>
          <h2 className="text-4xl font-bold text-slate-900">Loved by growth teams</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-slate-200 rounded-2xl p-7"
            >
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} fill="#F59E0B" className="text-amber-400" />
                ))}
              </div>
              <blockquote className="text-slate-700 leading-relaxed mb-5 text-[15px]">"{t.quote}"</blockquote>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-indigo-500 rounded-3xl px-10 py-16 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Start shortening links in 30 seconds
          </h2>
          <p className="text-indigo-200 mb-8 max-w-md mx-auto">
            Join thousands of marketers and developers who trust ClickSphere to power their links.
          </p>
          <Link to="/signup">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="bg-white text-indigo-600 font-bold px-8 py-3.5 rounded-xl text-sm hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Get Started Free →
            </motion.button>
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
