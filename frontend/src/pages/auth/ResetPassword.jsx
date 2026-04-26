import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../lib/api';
import { Loader2, CheckCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams]          = useSearchParams();
  const navigate                = useNavigate();
  const token                   = searchParams.get('token') || '';

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [done,        setDone]        = useState(false);
  const [error,       setError]       = useState('');

  // Si pas de token dans l'URL → lien invalide
  useEffect(() => {
    if (!token) setError('Lien invalide ou expiré. Demandez un nouveau lien.');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      await auth.resetPassword({ token, new_password: password });
      setDone(true);
      // Redirige vers login après 3 secondes
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Lien invalide ou expiré. Demandez un nouveau lien.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <div className="w-full max-w-sm">

        {/* Header — même style que ForgotPassword */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Washop" className="h-14 w-14 rounded-xl mx-auto mb-4 object-cover" />
          <h1 className="text-xl font-bold">Nouveau mot de passe</h1>
          <p className="text-sm text-gray-400 mt-1">Choisissez un mot de passe sécurisé pour votre compte.</p>
        </div>

        {/* Succès */}
        {done ? (
          <div className="glass p-6 text-center">
            <CheckCircle className="w-12 h-12 text-[#25D366] mx-auto mb-3" />
            <p className="text-sm font-semibold text-white mb-1">Mot de passe mis à jour !</p>
            <p className="text-sm text-gray-400 mb-4">Vous allez être redirigé vers la connexion…</p>
            <Link to="/login" className="text-[#25D366] text-sm hover:underline">Se connecter maintenant</Link>
          </div>

        ) : (
          <form onSubmit={handleSubmit} className="glass p-6 space-y-4">

            {/* Erreur globale */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Nouveau mot de passe */}
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  required
                  disabled={!token}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmer */}
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Confirmer le mot de passe</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  required
                  disabled={!token}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Réinitialiser le mot de passe
            </button>

            <p className="text-center text-sm">
              <Link to="/login" className="text-[#25D366] hover:underline">Retour à la connexion</Link>
            </p>

          </form>
        )}
      </div>
    </div>
  );
}
