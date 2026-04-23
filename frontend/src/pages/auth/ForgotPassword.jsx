import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../../contexts/LangContext';
import { auth } from '../../lib/api';
import { Loader2, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try { await auth.forgotPassword({ email }); setSent(true); }
    catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Washop" className="h-14 w-14 rounded-xl mx-auto mb-4 object-cover" />
          <h1 className="text-xl font-bold">{t.auth.forgot_title}</h1>
          <p className="text-sm text-gray-400 mt-1">{t.auth.forgot_desc}</p>
        </div>
        {sent ? (
          <div className="glass p-6 text-center">
            <CheckCircle className="w-12 h-12 text-[#25D366] mx-auto mb-3" />
            <p className="text-sm text-gray-300 mb-4">Si cet email existe, un lien de reinitialisation a ete envoye.</p>
            <Link to="/login" className="text-[#25D366] text-sm hover:underline">{t.auth.back_login}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}
            <div>
              <label className="text-sm text-gray-500 mb-1 block">{t.auth.email}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {t.auth.send_link}
            </button>
            <p className="text-center text-sm"><Link to="/login" className="text-[#25D366] hover:underline">{t.auth.back_login}</Link></p>
          </form>
        )}
      </div>
    </div>
  );
}
