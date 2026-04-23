import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vendors } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, Loader2, CheckCircle, Settings, Store, Link2 } from 'lucide-react';

export default function VendorProfile() {
  const { user, checkAuth } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [form, setForm] = useState({ shop_name: '', description: '', whatsapp_number: '', instagram_url: '', tiktok_url: '', facebook_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    vendors.me().then(r => {
      const v = r.data.data;
      setVendor(v);
      setForm({
        shop_name: v.shop_name || '', description: v.description || '', whatsapp_number: v.whatsapp_number || '',
        instagram_url: v.social_links?.instagram_url || '', tiktok_url: v.social_links?.tiktok_url || '', facebook_url: v.social_links?.facebook_url || '',
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setSaved(false); setError('');
    try {
      await vendors.updateMe({
        shop_name: form.shop_name, description: form.description, whatsapp_number: form.whatsapp_number,
        social_links: { instagram_url: form.instagram_url || undefined, tiktok_url: form.tiktok_url || undefined, facebook_url: form.facebook_url || undefined }
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    setSaving(false);
  };

  // Also update user profile
  const saveUserProfile = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const api = (await import('../../lib/api')).default;
      await api.put('/v1/users/me', { name: userForm.name, address: userForm.address });
      await checkAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    setSaving(false);
  };

  const [userForm, setUserForm] = useState({ name: user?.name || '', address: user?.address || '' });
  useEffect(() => { if (user) setUserForm({ name: user.name || '', address: user.address || '' }); }, [user]);

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-lg mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 animate-shimmer rounded-xl" />)}</div></div>;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="vendor-profile">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vendor/dashboard" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold">Mon profil</h1>
        </div>

        {error && <div className="p-3 mb-4 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

        {/* User info */}
        <form onSubmit={saveUserProfile} className="glass p-5 mb-4 space-y-4">
          <div className="flex items-center gap-2 mb-2"><Settings className="w-4 h-4 text-[#25D366]" /><h2 className="font-semibold text-sm">Informations personnelles</h2></div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Nom</label>
            <input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Adresse</label>
            <input value={userForm.address} onChange={e => setUserForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <button type="submit" disabled={saving} className="btn-secondary w-full !text-sm">Enregistrer</button>
        </form>

        {/* Shop settings */}
        <form onSubmit={save} className="glass p-5 mb-4 space-y-4">
          <div className="flex items-center gap-2 mb-2"><Store className="w-4 h-4 text-[#25D366]" /><h2 className="font-semibold text-sm">Ma boutique</h2></div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Nom de la boutique</label>
            <input value={form.shop_name} onChange={e => set('shop_name', e.target.value)} required data-testid="shop-name" />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} maxLength={2000} />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Numero WhatsApp</label>
            <input value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)} placeholder="+243..." required data-testid="whatsapp-number" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 !text-sm" data-testid="save-shop">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
            {saved ? 'Sauvegarde !' : 'Enregistrer'}
          </button>
        </form>

        {/* Social links */}
        <form onSubmit={save} className="glass p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2"><Link2 className="w-4 h-4 text-[#25D366]" /><h2 className="font-semibold text-sm">Reseaux sociaux</h2></div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Instagram</label>
            <input value={form.instagram_url} onChange={e => set('instagram_url', e.target.value)} placeholder="https://instagram.com/..." />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">TikTok</label>
            <input value={form.tiktok_url} onChange={e => set('tiktok_url', e.target.value)} placeholder="https://tiktok.com/@..." />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Facebook</label>
            <input value={form.facebook_url} onChange={e => set('facebook_url', e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full !text-sm">Enregistrer les reseaux</button>
        </form>

        {/* Shop link */}
        {vendor?.shop_slug && (
          <div className="glass p-4 mt-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Lien de votre boutique</p>
            <Link to={`/boutiques/${vendor.shop_slug}`} className="text-sm text-[#25D366] hover:underline font-mono">/boutiques/{vendor.shop_slug}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
