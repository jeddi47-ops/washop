import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vendors, accessKeys } from '../../lib/api';
import { ChevronLeft, Key, Clock, Loader2, CheckCircle, AlertTriangle, Crown, ShoppingBag, Sparkles, Check, X as XIcon } from 'lucide-react';

const planColor = { basic: 'from-gray-100 to-gray-200', premium: 'from-blue-50 to-blue-100', extra: 'from-green-50 to-green-100' };
const planBg = { basic: 'bg-gray-100 text-gray-600', premium: 'bg-blue-50 text-blue-600', extra: 'bg-green-50 text-[#25D366]' };
const planIcon = { basic: <ShoppingBag className="w-8 h-8" />, premium: <Crown className="w-8 h-8" />, extra: <Sparkles className="w-8 h-8" /> };

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
    Basic: { monthly: 'https://nzaofhms.mychariow.shop/prd_fih09v/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_vh8k9t/checkout' },
    Premium: { monthly: 'https://nzaofhms.mychariow.shop/prd_u4c5d3/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_w89k2c/checkout' },
    Extra: { monthly: 'https://nzaofhms.mychariow.shop/prd_mtxh4x/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_dlwst0/checkout' },
  };

  const plans = [
    { name: 'Basic', price: '10$/mois', features: ['15 produits max', 'Boutique visible', 'Rapport mensuel'], missing: ['Priorite recherche', 'Produit mis en avant', 'Rapport recherches'] },
    { name: 'Premium', price: '20$/mois', features: ['Produits illimites', 'Priorite recherche', 'Produit mis en avant/jour', 'Rapport mensuel'], missing: ['Email promo clients', 'Rapport recherches'] },
    { name: 'Extra', price: '40$/mois', features: ['Produits illimites', 'Priorite max', 'Produits promus', 'Email promo clients', 'Rapport recherches manquees', 'Rapport mensuel detaille'], missing: [] },
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map(p => {
              const isCurrent = p.name.toLowerCase() === plan;
              return (
                <div key={p.name} className={`rounded-xl p-4 border transition ${isCurrent ? 'border-[#25D366]/40 bg-[#25D366]/5' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{p.name}</h3>
                    {isCurrent && <span className="text-[10px] bg-[#25D366] text-white px-2 py-0.5 rounded-full font-bold">ACTUEL</span>}
                  </div>
                  <p className="text-xl font-bold text-[#25D366] mb-3">{p.price}</p>
                  <div className="space-y-2">
                    {p.features.map((f, i) => <div key={i} className="flex items-center gap-2 text-xs"><Check className="w-3 h-3 text-[#25D366] flex-shrink-0" /><span className="text-gray-600">{f}</span></div>)}
                    {p.missing.map((f, i) => <div key={i} className="flex items-center gap-2 text-xs"><XIcon className="w-3 h-3 text-gray-500 flex-shrink-0" /><span className="text-gray-500">{f}</span></div>)}
                  </div>
                  {!isCurrent && <a href={checkoutLinks[p.name]?.monthly} target="_blank" rel="noreferrer" className="mt-4 block text-center py-2 rounded-lg text-xs font-semibold btn-primary">Souscrire</a>}
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
