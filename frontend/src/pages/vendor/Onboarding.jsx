import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendors } from '../../lib/api';
import { MessageCircle, Store, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import PhoneInput from '../../components/shared/PhoneInput';

const steps = ['shop', 'whatsapp', 'done'];

export default function VendorOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ shop_name: '', description: '', whatsapp_number: '', instagram_url: '', tiktok_url: '', facebook_url: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const next = async () => {
    if (step === 0) {
      if (!form.shop_name.trim()) { setError('Nom de boutique requis'); return; }
      setStep(1);
      setError('');
    } else if (step === 1) {
      if (!form.whatsapp_number.trim()) { setError('Numero WhatsApp requis'); return; }
      setLoading(true); setError('');
      try {
        await vendors.create({
          shop_name: form.shop_name,
          description: form.description,
          whatsapp_number: form.whatsapp_number,
          social_links: { instagram_url: form.instagram_url || undefined, tiktok_url: form.tiktok_url || undefined, facebook_url: form.facebook_url || undefined }
        });
        setStep(2);
      } catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 flex items-center justify-center animate-fade-in" data-testid="vendor-onboarding">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${i <= step ? 'bg-[#25D366] text-white' : 'bg-gray-50 text-gray-500'}`}>{i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}</div>
              {i < steps.length - 1 && <div className={`w-12 h-0.5 ${i < step ? 'bg-[#25D366]' : 'bg-gray-50'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 0: Shop info */}
        {step === 0 && (
          <div className="glass p-6 space-y-4">
            <div className="text-center mb-4">
              <Store className="w-12 h-12 text-[#25D366] mx-auto mb-3" />
              <h2 className="text-xl font-bold">Configurez votre boutique</h2>
              <p className="text-sm text-gray-400 mt-1">Etape 1/2 — Informations de la boutique</p>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Nom de la boutique *</label>
              <input value={form.shop_name} onChange={e => set('shop_name', e.target.value)} placeholder="Ma Super Boutique" required data-testid="onboard-shop-name" />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Decrivez votre boutique..." />
            </div>
            <button onClick={next} className="btn-primary w-full flex items-center justify-center gap-2">Suivant <ChevronRight className="w-4 h-4" /></button>
          </div>
        )}

        {/* Step 1: WhatsApp + Social */}
        {step === 1 && (
          <div className="glass p-6 space-y-4">
            <div className="text-center mb-4">
              <MessageCircle className="w-12 h-12 text-[#25D366] mx-auto mb-3" />
              <h2 className="text-xl font-bold">Contact & Reseaux</h2>
              <p className="text-sm text-gray-400 mt-1">Etape 2/2 — WhatsApp et reseaux sociaux</p>
            </div>
            {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Numero WhatsApp *</label>
              <PhoneInput value={form.whatsapp_number} onChange={val => set('whatsapp_number', val)} testid="onboard-whatsapp" />
              <p className="text-xs text-gray-500 mt-1">Les clients vous contacteront via ce numero</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Instagram</label>
              <input value={form.instagram_url} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">TikTok</label>
              <input value={form.tiktok_url} onChange={e => set('tiktok_url', e.target.value)} placeholder="https://tiktok.com/@..." />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(0)} className="btn-secondary flex-1">Retour</button>
              <button onClick={next} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Creer ma boutique
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Success */}
        {step === 2 && (
          <div className="glass p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-[#25D366]/20 mx-auto mb-4 flex items-center justify-center animate-fade-scale">
              <CheckCircle className="w-10 h-10 text-[#25D366]" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Boutique creee !</h2>
            <p className="text-sm text-gray-500 mb-2">Vous beneficiez de 7 jours d'essai gratuit (Basic).</p>
            <p className="text-sm text-gray-500 mb-6">Ajoutez maintenant vos premiers produits.</p>
            <button onClick={() => navigate('/vendor/products')} className="btn-primary w-full mb-3">Ajouter des produits</button>
            <button onClick={() => navigate('/vendor/dashboard')} className="btn-secondary w-full !text-sm">Aller au tableau de bord</button>
          </div>
        )}
      </div>
    </div>
  );
}
