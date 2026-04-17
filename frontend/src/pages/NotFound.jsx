import React from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" data-testid="not-found-page">
      <img src="/logo.png" alt="Washop" className="h-16 w-16 rounded-xl mb-6 object-cover opacity-50" />
      <h1 className="text-6xl font-extrabold text-[#25D366] mb-4">404</h1>
      <p className="text-xl font-bold mb-2">{t.notfound.title}</p>
      <p className="text-sm text-gray-500 mb-8">{t.notfound.desc}</p>
      <Link to="/" className="btn-primary">{t.notfound.home}</Link>
    </div>
  );
}
