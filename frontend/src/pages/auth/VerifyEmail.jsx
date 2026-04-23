import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { auth as authApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Landing page of the verification email link. Reads the `token` from the URL,
 * hits the backend, and shows a success / error state.
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

  const goNext = () => {
    if (user?.role === 'vendor') navigate('/vendor/dashboard');
    else if (user?.role === 'client') navigate('/client/dashboard');
    else navigate('/login');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10"
      data-testid="verify-email-page"
    >
      <div className="w-full max-w-md text-center">
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
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#25D366]/10 mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#25D366]" strokeWidth={2} />
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900 mb-3"
              data-testid="verify-email-success-title"
            >
              Adresse vérifiée !
            </h1>
            <p className="text-gray-600 mb-8">
              {message}. Votre compte Washop est désormais pleinement actif.
            </p>
            <button
              type="button"
              onClick={goNext}
              data-testid="verify-email-continue-btn"
              className="px-6 py-3 rounded-full bg-[#25D366] text-white font-semibold hover:bg-[#128C7E] transition-colors"
            >
              Continuer
            </button>
          </>
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
