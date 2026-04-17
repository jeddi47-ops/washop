import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../contexts/LangContext';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 mt-20" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="Washop" className="h-10 w-10 rounded-lg object-cover" />
              <span className="text-xl font-bold">Wa<span className="text-[#25D366]">shop</span></span>
            </Link>
            <p className="text-sm text-gray-500 max-w-sm">{t.footer.tagline}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Washop</h4>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-gray-400 hover:text-[#25D366] transition">{t.footer.about}</Link>
              <Link to="/about" className="text-sm text-gray-400 hover:text-[#25D366] transition">{t.footer.contact}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link to="/about" className="text-sm text-gray-400 hover:text-[#25D366] transition">{t.footer.terms}</Link>
              <Link to="/about" className="text-sm text-gray-400 hover:text-[#25D366] transition">{t.footer.privacy}</Link>
            </div>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-gray-600">&copy; 2025 Washop &mdash; {t.footer.rights}</p>
        </div>
      </div>
    </footer>
  );
}
