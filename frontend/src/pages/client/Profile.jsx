import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { auth as authApi } from '../../lib/api';
import { ChevronLeft, Loader2, User, Lock, CheckCircle } from 'lucide-react';

export default function ClientProfile() {
  const { user, checkAuth } = useAuth();
  const [form, setForm] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', address: user.address || '' });
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault(); setLoading(true); setSaved(false);
    try {
      const api = (await import('../../lib/api')).default;
      await api.put('/v1/users/me', { name: form.name, address: form.address });
      await checkAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="client-profile">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/client/dashboard" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold">Mon profil</h1>
        </div>

        {/* Avatar */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#25D366] mx-auto flex items-center justify-center text-3xl font-bold">{user?.name?.[0]?.toUpperCase()}</div>
          <p className="font-semibold mt-3">{user?.name}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-block mt-1 text-xs bg-gray-50 px-3 py-1 rounded-full text-gray-600">{user?.role}</span>
        </div>

        {/* Profile form */}
        <form onSubmit={saveProfile} className="glass p-5 mb-6 space-y-4">
          <div className="flex items-center gap-2 mb-2"><User className="w-4 h-4 text-[#25D366]" /><h2 className="font-semibold text-sm">Informations</h2></div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Nom</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required data-testid="profile-name" />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Adresse</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} data-testid="profile-address" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2" data-testid="save-profile">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
            {saved ? 'Sauvegarde !' : loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>

        {/* Password section */}
        <div className="glass p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2"><Lock className="w-4 h-4 text-[#25D366]" /><h2 className="font-semibold text-sm">Changer le mot de passe</h2></div>
          {pwMsg && <div className={`p-3 rounded-lg text-sm ${pwMsg.includes('succes') ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-red-500/10 text-red-400'}`}>{pwMsg}</div>}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Nouveau mot de passe</label>
            <input type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} minLength={6} />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Confirmer</label>
            <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
          </div>
          <button
            type="button"
            disabled={pwLoading || !pwForm.newPw || pwForm.newPw !== pwForm.confirm}
            onClick={async () => {
              setPwLoading(true); setPwMsg('');
              try {
                await authApi.forgotPassword({ email: user.email });
                setPwMsg('Un email de reinitialisation a ete envoye.');
              } catch { setPwMsg('Erreur'); }
              setPwLoading(false);
            }}
            className="btn-secondary w-full flex items-center justify-center gap-2 !text-sm"
          >
            {pwLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Envoyer le lien de reinitialisation
          </button>
        </div>
      </div>
    </div>
  );
}
