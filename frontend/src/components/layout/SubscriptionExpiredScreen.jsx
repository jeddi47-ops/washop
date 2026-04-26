import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { accessKeys } from '../../lib/api';
import {
  Key, Loader2, CheckCircle, AlertTriangle,
  ShoppingBag, Crown, Sparkles, Check, X as XIcon, Lock,
} from 'lucide-react';

/* ─── Plans data (mirrors Subscription.jsx) ─────────────────────────────── */
const checkoutLinks = {
  Basic:   { monthly: 'https://nzaofhms.mychariow.shop/prd_fih09v/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_vh8k9t/checkout' },
  Premium: { monthly: 'https://nzaofhms.mychariow.shop/prd_u4c5d3/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_w89k2c/checkout' },
  Extra:   { monthly: 'https://nzaofhms.mychariow.shop/prd_mtxh4x/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_dlwst0/checkout' },
};

const plans = [
  {
    name: 'Basic', price: '10$/mois', Icon: ShoppingBag,
    features: ['15 produits max', 'Boutique visible', 'Rapport mensuel'],
    missing:  ['Priorité recherche', 'Produit mis en avant', 'Rapport recherches'],
  },
  {
    name: 'Premium', price: '20$/mois', Icon: Crown,
    features: ['Produits illimités', 'Priorité recherche', 'Produit mis en avant/jour', 'Rapport mensuel'],
    missing:  ['Email promo clients', 'Rapport recherches'],
  },
  {
    name: 'Extra', price: '40$/mois', Icon: Sparkles,
    features: ['Produits illimités', 'Priorité max', 'Produits promus', 'Email promo clients', 'Rapport recherches manquées', 'Rapport mensuel détaillé'],
    missing:  [],
  },
];

/* ─── Component ─────────────────────────────────────────────────────────── */
/**
 * Full-screen overlay shown when a vendor's trial or subscription has expired.
 * Provides an inline key-activation form + plan comparison so the vendor
 * can resume access without leaving the screen.
 *
 * Props
 *  - isTrial  {boolean}   true = trial expired, false = paid subscription expired
 *  - onRefresh {function} called after a successful key activation so App.js
 *                         can re-check status and dismiss this screen
 */
export default function SubscriptionExpiredScreen({ isTrial = false, onRefresh }) {
  const { user, logout } = useAuth();

  const [keyCode,    setKeyCode]    = useState('');
  const [activating, setActivating] = useState(false);
  const [result,     setResult]     = useState(null);
  const [tab,        setTab]        = useState('monthly'); // 'monthly' | 'annual'

  const handleActivate = async () => {
    if (!keyCode.trim()) return;
    setActivating(true);
    setResult(null);
    try {
      const { data } = await accessKeys.activate({ key_code: keyCode.trim().toUpperCase() });
      setResult({ success: true, message: data.message });
      setKeyCode('');
      // Give a brief moment for the success message to show, then refresh
      setTimeout(() => onRefresh?.(), 1200);
    } catch (err) {
      setResult({
        success: false,
        message: err.response?.data?.detail || 'Clé invalide ou déjà utilisée.',
      });
    }
    setActivating(false);
  };

  return (
    <div
      data-testid="subscription-expired-screen"
      className="fixed inset-0 z-[9999] bg-white overflow-y-auto"
    >
      <div className="min-h-full flex flex-col items-center px-4 py-10">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="w-full max-w-lg text-center mb-8">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-5"
               style={{ backgroundColor: '#f3e8ff' }}>
            <Lock size={38} style={{ color: '#7C3AED' }} strokeWidth={2} />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
              style={{ color: '#7C3AED' }}>
            {isTrial ? 'Essai gratuit expiré' : 'Abonnement expiré'}
          </h1>

          <p className="text-gray-600 text-base md:text-lg mb-2">
            {isTrial
              ? 'Votre période d\'essai de 7 jours est terminée.'
              : 'Votre abonnement a expiré.'}
          </p>
          <p className="text-gray-500 text-sm">
            Votre boutique est temporairement invisible. Activez une clé d'accès
            ou souscrivez à un plan pour reprendre immédiatement.
          </p>

          {user?.email && (
            <p className="text-xs text-gray-400 mt-3">
              Compte : <span className="font-mono text-gray-600">{user.email}</span>
            </p>
          )}
        </div>

        {/* ── Key activation ────────────────────────────────────────────── */}
        <div className="w-full max-w-lg rounded-2xl border border-purple-100 bg-purple-50/50 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Key size={18} style={{ color: '#7C3AED' }} />
            <h2 className="font-bold text-gray-900">Activer une clé d'accès</h2>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            Vous avez reçu une clé d'activation ? Entrez-la ci-dessous pour
            débloquer votre boutique instantanément.
          </p>

          <div className="flex gap-2">
            <input
              value={keyCode}
              onChange={e => {
                // Auto-format XXXX-XXXX-XXXX-XXXX
                const raw = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 16);
                const formatted = raw.match(/.{1,4}/g)?.join('-') || raw;
                setKeyCode(formatted);
              }}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              maxLength={19}
              data-testid="sub-expired-key-input"
              className="flex-1 px-4 py-2.5 text-sm font-mono tracking-widest uppercase border border-purple-200 rounded-xl bg-white outline-none focus:border-purple-500 transition"
            />
            <button
              onClick={handleActivate}
              disabled={activating || !keyCode.trim()}
              data-testid="sub-expired-activate-btn"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition disabled:opacity-50"
              style={{ background: activating || !keyCode.trim() ? '#a78bfa' : '#7C3AED' }}
            >
              {activating
                ? <Loader2 size={16} className="animate-spin" />
                : <Key size={16} />}
              Activer
            </button>
          </div>

          {result && (
            <div className={`mt-3 p-3 rounded-xl text-sm flex items-center gap-2 ${
              result.success
                ? 'bg-green-50 text-green-700 border border-green-100'
                : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {result.success
                ? <CheckCircle size={16} className="flex-shrink-0" />
                : <AlertTriangle size={16} className="flex-shrink-0" />}
              {result.message}
            </div>
          )}
        </div>

        {/* ── Plan comparison ───────────────────────────────────────────── */}
        <div className="w-full max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 text-lg">Nos offres</h2>
            {/* Monthly / Annual toggle */}
            <div className="flex bg-gray-100 rounded-full p-1 text-xs font-semibold">
              <button
                onClick={() => setTab('monthly')}
                className={`px-4 py-1.5 rounded-full transition ${tab === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setTab('annual')}
                className={`px-4 py-1.5 rounded-full transition ${tab === 'annual' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                Annuel
                <span className="ml-1 text-[10px] text-green-600 font-bold">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {plans.map((p) => {
              const PlanIcon = p.Icon;
              const link = checkoutLinks[p.name]?.[tab];
              return (
                <div
                  key={p.name}
                  className="rounded-2xl border bg-white p-5 flex flex-col transition hover:shadow-md"
                  style={{ borderColor: p.name === 'Extra' ? '#25D366' : '#e5e7eb' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-lg" style={{ background: p.name === 'Extra' ? '#f0fdf4' : '#f3e8ff' }}>
                      <PlanIcon size={18} style={{ color: p.name === 'Extra' ? '#25D366' : '#7C3AED' }} />
                    </div>
                    <span className="font-bold text-gray-900">{p.name}</span>
                    {p.name === 'Extra' && (
                      <span className="ml-auto text-[10px] bg-[#25D366] text-white px-2 py-0.5 rounded-full font-bold">POPULAIRE</span>
                    )}
                  </div>

                  <p className="text-2xl font-bold mb-4" style={{ color: p.name === 'Extra' ? '#25D366' : '#7C3AED' }}>
                    {p.price}
                  </p>

                  <div className="space-y-2 flex-1 mb-5">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-700">
                        <Check size={13} style={{ color: '#25D366', flexShrink: 0 }} />{f}
                      </div>
                    ))}
                    {p.missing.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                        <XIcon size={13} style={{ flexShrink: 0 }} />{f}
                      </div>
                    ))}
                  </div>

                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ background: p.name === 'Extra' ? '#25D366' : '#7C3AED' }}
                  >
                    Souscrire →
                  </a>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-400 mb-6">
            Après paiement, vous recevrez une clé d'activation à entrer ci-dessus.
          </p>
        </div>

        {/* ── Footer actions ────────────────────────────────────────────── */}
        <button
          onClick={logout}
          className="text-sm text-gray-400 hover:text-gray-600 transition underline underline-offset-2"
        >
          Se déconnecter
        </button>

        <p className="mt-6 text-xs text-gray-300">
          Wa<span style={{ color: '#25D366' }}>shop</span> · Marketplace WhatsApp
        </p>

      </div>
    </div>
  );
}
