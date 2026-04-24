import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { PartyPopper, XCircle, Loader2, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { auth as authApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Landing page of the verification email link. Reads the `token` from the URL,
 * hits the backend, and shows a success / error state with a confetti
 * celebration on success.
 */
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const token = params.get('token');

  const [state, setState] = useState('pending'); // 'pending' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const hasRun = useRef(false);

  useEffect(() => {
    // Guard against React 18 StrictMode double-invocation in dev.
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      setState('error');
      setMessage("Lien invalide : aucun jeton fourni.");
      return;
    }

    (async () => {
      try {
        const { data } = await authApi.verifyEmail({ token });
        setState('success');
        setMessage(data?.message || 'Adresse email vérifiée');
        // Refresh the auth context so the UI reflects email_verified: true
        try { await checkAuth(); } catch { /* non-blocking */ }
      } catch (err) {
        const d = err.response?.data?.detail;
        setState('error');
        setMessage(
          typeof d === 'string'
            ? d
            : "Ce lien de vérification est invalide ou a expiré. Demandez un nouveau lien depuis votre compte."
        );
      }
    })();
  }, [token, checkAuth]);

  // Launch a multi-wave confetti burst once the success state is reached.
  useEffect(() => {
    if (state !== 'success') return;

    const duration = 3500;
    const end = Date.now() + duration;
    const palette = ['#25D366', '#128C7E', '#FFD700', '#FF6B6B', '#4ECDC4', '#FFFFFF'];

    // Big opening burst from the center
    confetti({
      particleCount: 140,
      spread: 90,
      startVelocity: 45,
      origin: { y: 0.55 },
      colors: palette,
      scalar: 1.1,
    });

    // Continuous side bursts for ~3.5s
    const interval = setInterval(() => {
      if (Date.now() > end) {
        clearInterval(interval);
        return;
      }
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: palette,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: palette,
      });
    }, 220);

    return () => clearInterval(interval);
  }, [state]);

  const goNext = () => {
    if (user?.role === 'vendor') navigate('/vendor/dashboard');
    else if (user?.role === 'admin') navigate('/admin/dashboard');
    else if (user?.role === 'employee') navigate('/employee/claims');
    else if (user?.role === 'client') navigate('/client/dashboard');
    else navigate('/login');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10 relative overflow-hidden"
      data-testid="verify-email-page"
    >
      {/* Soft animated background only on success */}
      {state === 'success' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-[#25D366]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#128C7E]/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.6s' }} />
        </div>
      )}

      <div className="w-full max-w-md text-center relative z-10">
        {state === 'pending' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
              <Loader2 className="w-10 h-10 text-gray-500 animate-spin" strokeWidth={2} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Vérification en cours…
            </h1>
            <p className="text-gray-500">Merci de patienter quelques secondes.</p>
          </>
        )}

        {state === 'success' && (
          <div className="animate-fade-scale">
            <div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
            >
              <PartyPopper className="w-12 h-12 text-white" strokeWidth={2} />
            </div>

            <h1
              className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-3 tracking-tight"
              data-testid="verify-email-success-title"
            >
              Bienvenue{user?.name ? `, ${user.name}` : ''} ! 🎉
            </h1>

            <p className="text-lg text-gray-700 mb-2 font-medium">
              Merci pour votre inscription sur Washop.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Votre adresse email est désormais vérifiée et votre compte est pleinement actif.
              Vous pouvez commencer à explorer la marketplace WhatsApp dès maintenant.
            </p>

            <button
              type="button"
              onClick={goNext}
              data-testid="verify-email-continue-btn"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#25D366] text-white font-semibold text-base shadow-lg hover:bg-[#128C7E] hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200"
            >
              <ShoppingBag className="w-5 h-5" />
              Aller à la boutique
            </button>

            <p className="mt-8 text-xs text-gray-400">
              Wa<span className="text-[#25D366] font-semibold">shop</span> · Marketplace WhatsApp
            </p>
          </div>
        )}

        {state === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
              <XCircle className="w-10 h-10 text-red-600" strokeWidth={2} />
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
              data-testid="verify-email-error-title"
            >
              Vérification impossible
            </h1>
            <p className="text-gray-600 mb-8" data-testid="verify-email-error-message">
              {message}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="px-6 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
              >
                Me connecter
              </Link>
              <Link
                to="/verify-email-sent"
                className="px-6 py-3 rounded-full bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Demander un nouveau lien
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
