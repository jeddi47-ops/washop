import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { Eye, EyeOff, Loader2, ShoppingBag, Store } from 'lucide-react';
import { HowItWorks, PricingSection } from '../Home';

export default function Register() {
  const { register } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '', shop_name: '', whatsapp_number: '' });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!acceptTerms) {
      setError("Vous devez accepter les CGU et la politique de confidentialité pour créer un compte.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        address: form.address,
        role,
        accept_terms: true,
      };
      await register(payload);
      // The email-verification wall will take over automatically on /
      // (because user.email_verified === false) until the user clicks the
      // link received by email.
      navigate('/', { replace: true });
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === 'string' ? d : Array.isArray(d) ? d.map(e => e.msg).join(', ') : "Erreur d'inscription");
    } finally { setLoading(false); }
  };

  if (!role) {
    return (
      <div className="min-h-screen pt-20 pb-10" data-testid="register-page">
        <div className="max-w-md mx-auto px-4 mb-10">
          <div className="text-center">
            <img src="/logo.png" alt="Washop" className="h-16 w-16 rounded-xl mx-auto mb-4 object-cover" />
            <h1 className="text-2xl font-bold">{t.auth.register_title}</h1>
            <p className="text-sm text-gray-500 mt-2">Avant de commencer, voici comment Washop fonctionne et quels plans sont proposés.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <button onClick={() => setRole('client')} className="glass p-6 text-center hover:border-[#25D366]/40 transition-all group" data-testid="role-client">
              <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-[#25D366] group-hover:scale-110 transition-transform" />
              <p className="font-bold mb-1">{t.auth.client_role}</p>
              <p className="text-xs text-gray-500">{t.auth.client_desc}</p>
            </button>
            <button onClick={() => setRole('vendor')} className="glass p-6 text-center hover:border-[#25D366]/40 transition-all group" data-testid="role-vendor">
              <Store className="w-10 h-10 mx-auto mb-3 text-[#25D366] group-hover:scale-110 transition-transform" />
              <p className="font-bold mb-1">{t.auth.vendor_role}</p>
              <p className="text-xs text-gray-500">{t.auth.vendor_desc}</p>
            </button>
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">{t.auth.has_account} <Link to="/login" className="text-[#25D366] hover:underline font-medium">{t.nav.login}</Link></p>
        </div>

        {/* Contextual info sections — moved from the public home page so they
            are only shown to people who are actually considering signing up. */}
        <HowItWorks />
        <PricingSection />

        <div className="max-w-md mx-auto px-4 mt-10 text-center">
          <button onClick={() => setRole('client')} className="btn-primary !px-8" data-testid="role-client-cta">
            Créer mon compte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10" data-testid="register-form-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="Washop" className="h-14 w-14 rounded-xl mx-auto mb-3 object-cover" />
          <h1 className="text-xl font-bold">{t.auth.register_title}</h1>
          <button onClick={() => setRole('')} className="text-sm text-[#25D366] mt-1 hover:underline">&larr; {role === 'client' ? t.auth.client_role : t.auth.vendor_role}</button>
        </div>
        <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm" data-testid="register-error">{error}</div>}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">{t.auth.name}</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} required data-testid="register-name" />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">{t.auth.email}</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required data-testid="register-email" />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">{t.auth.password}</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} data-testid="register-password" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">{t.auth.address}</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} data-testid="register-address" />
          </div>
          <label className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={e => setAcceptTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#25D366] cursor-pointer flex-shrink-0"
              data-testid="register-accept-terms"
              required
            />
            <span className="text-xs text-gray-700 leading-relaxed">
              J'accepte les{' '}
              <Link to="/terms" target="_blank" className="text-[#25D366] hover:underline font-medium">
                Conditions Générales d'Utilisation
              </Link>
              {' '}et la{' '}
              <Link to="/privacy" target="_blank" className="text-[#25D366] hover:underline font-medium">
                Politique de confidentialité
              </Link>
              . J'autorise Washop à m'envoyer des emails liés à mon compte et à mon activité (confirmations, ventes flash, mises à jour).
            </span>
          </label>
          <button type="submit" disabled={loading || !acceptTerms} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" data-testid="register-submit">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {loading ? t.common.loading : t.auth.register_btn}
          </button>
          <p className="text-center text-sm text-gray-600">{t.auth.has_account} <Link to="/login" className="text-[#25D366] hover:underline font-medium">{t.nav.login}</Link></p>
        </form>
      </div>
    </div>
  );
}
