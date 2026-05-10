import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vendors, accessKeys } from '../../lib/api';
import { ChevronLeft, Key, Clock, Loader2, CheckCircle, AlertTriangle, Crown, ShoppingBag, Check, X as XIcon } from 'lucide-react';

const planColor = { basic: 'from-gray-100 to-gray-200', premium: 'from-blue-50 to-blue-100' };
const planBg = { basic: 'bg-gray-100 text-gray-600', premium: 'bg-blue-50 text-blue-600' };
const planIcon = { basic: <ShoppingBag className="w-8 h-8" />, premium: <Crown className="w-8 h-8" /> };

export default function VendorSubscription() {
  const [vendor, setVendor] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyCode, setKeyCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [result, setResult] = useState(null);

  const fetchData = async () => {
    try {
      const v = await vendors.me();
      setVendor(v.data.data);
      const h = await accessKeys.history(v.data.data.id, { limit: 20 });
      setHistory(h.data.data || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const activateKey = async (e) => {
    e.preventDefault();
    if (!keyCode.trim()) return;
    setActivating(true); setResult(null);
    try {
      const { data } = await accessKeys.activate({ key_code: keyCode.trim().toUpperCase() });
      setResult({ success: true, data: data.data, message: data.message });
      setKeyCode('');
      fetchData();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.detail || 'Cle invalide' });
    }
    setActivating(false);
  };

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-3xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 animate-shimmer rounded-xl" />)}</div></div>;

  const isTrial = vendor && vendor.trial_expires_at && !vendor.subscription_expires_at;
  const trialDays = isTrial ? Math.max(0, Math.ceil((new Date(vendor.trial_expires_at) - new Date()) / 86400000)) : 0;
  const subDays = vendor?.subscription_expires_at ? Math.max(0, Math.ceil((new Date(vendor.subscription_expires_at) - new Date()) / 86400000)) : 0;
  const isExpired = vendor && !vendor.is_active;
  const plan = vendor?.subscription_type || 'basic';

  const checkoutLinks = {
    Basic:   { monthly: 'https://nzaofhms.mychariow.shop/prd_fih09v/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_vh8k9t/checkout' },
    Premium: { monthly: 'https://nzaofhms.mychariow.shop/prd_u4c5d3/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_w89k2c/checkout' },
  };

  const plans = [
    {
      name: 'Basic', price: '10$/mois',
      features: [
        '30 produits maximum',
        'Boutique premium visible',
        '3 thèmes de couleur',
        '3 catégories boutique',
        'Statistiques basiques',
        'Lien boutique unique',
      ],
      missing: [
        'Badge vérifié',
        'Produit mis en avant',
        'Thèmes illimités',
        'Catégories illimitées',
        'Statistiques avancées',
      ],
    },
    {
      name: 'Premium', price: '20$/mois',
      features: [
        'Produits illimités',
        'Boutique premium visible',
        '8 thèmes de couleur',
        'Catégories illimitées',
        'Badge vérifié ✓',
        '1 produit mis en avant/jour',
        'Statistiques avancées',
        'Lien boutique unique',
      ],
      missing: [],
    },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="vendor-subscription">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vendor/dashboard" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold">Abonnement</h1>
        </div>

        {/* Current plan */}
        <div className={`glass p-6 mb-6 bg-gradient-to-r ${planColor[plan]} bg-opacity-10 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 opacity-5">{planIcon[plan] && React.cloneElement(planIcon[plan], { className: 'w-32 h-32' })}</div>
          <div className="relative">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${planBg[plan]}`}>{plan}</span>
            <h2 className="text-2xl font-bold mt-3">{vendor?.shop_name}</h2>
            {isExpired ? (
              <div className="flex items-center gap-2 mt-2 text-red-400"><AlertTriangle className="w-4 h-4" /><span className="text-sm font-semibold">Abonnement expire — Boutique invisible</span></div>
            ) : isTrial ? (
              <div className="flex items-center gap-2 mt-2 text-yellow-400"><Clock className="w-4 h-4" /><span className="text-sm">Essai gratuit — J-{trialDays}</span></div>
            ) : (
              <div className="flex items-center gap-2 mt-2 text-gray-300"><Clock className="w-4 h-4" /><span className="text-sm">{subDays} jours restants (expire le {new Date(vendor.subscription_expires_at).toLocaleDateString('fr-FR')})</span></div>
            )}
          </div>
        </div>

        {/* Activate key */}
        <div className="glass p-5 mb-6">
          <h2 className="font-bold mb-3 flex items-center gap-2"><Key className="w-4 h-4 text-[#25D366]" /> Activer une cle d'acces</h2>
          <form onSubmit={activateKey} className="flex gap-2">
            <input value={keyCode} onChange={e => setKeyCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX-XXXX" className="flex-1 !text-sm !font-mono !tracking-wider !uppercase" maxLength={19} data-testid="key-input" />
            <button type="submit" disabled={activating || !keyCode.trim()} className="btn-primary !px-6 !text-sm flex items-center gap-2" data-testid="activate-key-btn">
              {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />} Activer
            </button>
          </form>
          {result && (
            <div className={`mt-3 p-3 rounded-lg text-sm flex items-center gap-2 ${result.success ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-red-500/10 text-red-400'}`}>
              {result.success ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
              {result.message}
            </div>
          )}
        </div>

        {/* Plan comparison */}
        <div className="glass p-5 mb-6">
          <h2 className="font-bold mb-4">Comparer les plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map(p => {
              const isCurrent = p.name.toLowerCase() === plan;
              const isPremium = p.name === 'Premium';
              return (
                <div key={p.name} className={`rounded-xl p-5 border-2 transition relative ${isCurrent ? 'border-[#25D366]' : isPremium ? 'border-blue-400' : 'border-gray-200'} bg-white`}>
                  {isPremium && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      RECOMMANDÉ
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 right-4 bg-[#25D366] text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      ACTUEL
                    </span>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg" style={{ background: isPremium ? '#eff6ff' : '#f9fafb' }}>
                      {React.cloneElement(planIcon[p.name.toLowerCase()] || planIcon.basic, {
                        className: `w-6 h-6 ${isPremium ? 'text-blue-500' : 'text-gray-500'}`
                      })}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{p.name}</h3>
                      <p className="text-2xl font-extrabold" style={{ color: isPremium ? '#3b82f6' : '#25D366' }}>{p.price}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-5">
                    {p.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <Check className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0" />
                        <span className="text-gray-700">{f}</span>
                      </div>
                    ))}
                    {p.missing.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <XIcon className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                        <span className="text-gray-400">{f}</span>
                      </div>
                    ))}
                  </div>
                  {!isCurrent && (
                    <a href={checkoutLinks[p.name]?.monthly} target="_blank" rel="noreferrer"
                      className={`block text-center py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 ${isPremium ? 'bg-blue-500' : 'bg-[#25D366]'}`}>
                      Souscrire →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* History */}
        <div className="glass p-5">
          <h2 className="font-bold mb-4">Historique</h2>
          {history.length === 0 ? <p className="text-gray-500 text-sm text-center py-4">Aucun historique</p> :
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <Key className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{h.type?.toUpperCase()} / {h.duration}</p>
                  <p className="text-xs text-gray-500">{h.action} — {new Date(h.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs text-gray-600">{new Date(h.started_at).toLocaleDateString()} → {new Date(h.expires_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>}
        </div>
      </div>
    </div>
  );
}
