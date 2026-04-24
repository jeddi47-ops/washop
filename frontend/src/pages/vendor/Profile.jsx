import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { vendors } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronLeft, Loader2, CheckCircle, Settings, Store, Link2, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import ShareShopCard from '../../components/shared/ShareShopCard';

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

        {/* Shop appearance (banner + avatar) */}
        {vendor && (
          <ShopAppearance vendor={vendor} onChange={setVendor} />
        )}

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
          <div className="mt-4">
            <ShareShopCard slug={vendor.shop_slug} shopName={vendor.shop_name} />
          </div>
        )}
      </div>
    </div>
  );
}


/**
 * "Apparence de ma boutique" card — lets the vendor upload a banner
 * (wide 3:1 image shown at the top of their public shop page) and an
 * avatar (square logo displayed as a circle overlapping the banner).
 */
function ShopAppearance({ vendor, onChange }) {
  const bannerRef = useRef(null);
  const avatarRef = useRef(null);
  const [uploading, setUploading] = useState(null); // 'banner' | 'avatar' | null
  const [err, setErr] = useState('');

  const handleUpload = async (kind, file) => {
    if (!file) return;
    setErr('');
    setUploading(kind);
    try {
      const { data } = await vendors.uploadImage(kind, file);
      onChange((v) => ({ ...(v || vendor), [`${kind}_url`]: data?.data?.url }));
    } catch (e) {
      setErr(e.response?.data?.detail || `Échec de l'envoi de ${kind === 'banner' ? 'la bannière' : "l'avatar"}`);
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (kind) => {
    setErr('');
    setUploading(kind);
    try {
      await vendors.deleteImage(kind);
      onChange((v) => ({ ...(v || vendor), [`${kind}_url`]: null }));
    } catch (e) {
      setErr(e.response?.data?.detail || 'Suppression échouée');
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="glass p-5 mb-4 space-y-4" data-testid="shop-appearance">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-[#25D366]" />
        <h2 className="font-semibold text-sm">Apparence de ma boutique</h2>
      </div>
      <p className="text-xs text-gray-500 -mt-2">
        Une belle bannière et un avatar donnent à votre boutique un look premium et rassurent vos clients.
      </p>

      {err && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-xs border border-red-200">{err}</div>}

      {/* Banner preview + upload */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Bannière (image large, recommandé 1500×500)</label>
        <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden border border-gray-200 bg-gradient-to-br from-[#25D366]/10 via-white to-[#128C7E]/10">
          {vendor.banner_url ? (
            <img src={vendor.banner_url} alt="Bannière" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="w-8 h-8 mb-1" />
              <p className="text-xs">Aucune bannière</p>
            </div>
          )}
          {uploading === 'banner' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
        </div>
        <input
          ref={bannerRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleUpload('banner', e.target.files[0])}
        />
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            disabled={!!uploading}
            data-testid="upload-banner-btn"
            className="btn-secondary !py-2 !px-3 !text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            {vendor.banner_url ? 'Changer' : 'Ajouter une bannière'}
          </button>
          {vendor.banner_url && (
            <button
              type="button"
              onClick={() => handleDelete('banner')}
              disabled={!!uploading}
              className="!py-2 !px-3 !text-xs rounded-full border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Avatar preview + upload */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Avatar / Logo (carré, 500×500)</label>
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white text-2xl font-bold">
            {vendor.avatar_url ? (
              <img src={vendor.avatar_url} alt="Avatar" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <span>{vendor.shop_name?.[0]?.toUpperCase() || 'W'}</span>
            )}
            {uploading === 'avatar' && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
            )}
          </div>
          <input
            ref={avatarRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleUpload('avatar', e.target.files[0])}
          />
          <div className="flex flex-col gap-2 flex-1">
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              disabled={!!uploading}
              data-testid="upload-avatar-btn"
              className="btn-secondary !py-2 !px-3 !text-xs flex items-center gap-1.5 disabled:opacity-50 w-full justify-center"
            >
              <Camera className="w-3.5 h-3.5" />
              {vendor.avatar_url ? "Changer l'avatar" : 'Ajouter un avatar'}
            </button>
            {vendor.avatar_url && (
              <button
                type="button"
                onClick={() => handleDelete('avatar')}
                disabled={!!uploading}
                className="!py-2 !px-3 !text-xs rounded-full border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 flex items-center justify-center gap-1.5 disabled:opacity-50 w-full"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
