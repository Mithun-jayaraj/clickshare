import { Link } from 'react-router-dom';
import { Zap, Twitter, Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
                <Zap size={14} fill="white" className="text-white" />
              </div>
              <span className="font-bold text-slate-900">ClickSphere</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              The intelligence layer for every link. Built for modern growth teams.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="text-slate-400 hover:text-slate-700 transition-colors"><Twitter size={16} /></a>
              <a href="#" className="text-slate-400 hover:text-slate-700 transition-colors"><Github size={16} /></a>
              <a href="#" className="text-slate-400 hover:text-slate-700 transition-colors"><Linkedin size={16} /></a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Product</h4>
            <ul className="space-y-2.5">
              {['Features', 'Analytics', 'Pricing', 'Changelog'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Company</h4>
            <ul className="space-y-2.5">
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-400">© 2025 ClickSphere. All rights reserved.</p>
          <p className="text-sm text-slate-400">
            Part of{' '}
            <a href="https://katomaran.com" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline font-medium">
              Katomaran Hackathon
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
