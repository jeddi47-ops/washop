import React, { useEffect, useState, useCallback } from 'react';
import { MailCheck, Loader2, RefreshCw, LogOut } from 'lucide-react';
import { auth as authApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

const COOLDOWN_SECONDS = 180; // 3 min, kept in sync with backend

/**
 * Full-screen blocker shown whenever the currently logged-in user has NOT
 * verified their email yet. It replaces the entire UI so the account cannot
 * be used until the link in the inbox is clicked. A 3-minute countdown gates
 * the "resend" button to prevent inbox flooding.
 */
export default function EmailVerificationWall() {
  const { user, logout, checkAuth } = useAuth();
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Countdown tick
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const startCooldownFromServer = useCallback((iso) => {
    if (!iso) { setSecondsLeft(COOLDOWN_SECONDS); return; }
    const remaining = Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));
    setSecondsLeft(remaining || COOLDOWN_SECONDS);
  }, []);

  const handleResend = async () => {
    if (secondsLeft > 0 || resending) return;
    setResending(true);
    setFeedback(null);
    try {
      const { data } = await authApi.resendVerification();
      startCooldownFromServer(data?.data?.next_resend_available_at);
      setFeedback({ type: 'success', message: data?.message || 'Un nouveau lien vient de partir.' });
    } catch (err) {
      const d = err.response?.data?.detail;
      if (err.response?.status === 429 && d?.next_resend_available_at) {
        startCooldownFromServer(d.next_resend_available_at);
        setFeedback({ type: 'info', message: d?.message || 'Un email a déjà été envoyé récemment.' });
      } else {
        setFeedback({
          type: 'error',
          message: typeof d === 'string' ? d : "Impossible de renvoyer l'email. Réessayez plus tard.",
        });
      }
    } finally {
      setResending(false);
    }
  };

  // If the user validates in another tab, refresh auth so the wall disappears.
  useEffect(() => {
    const onFocus = () => { try { checkAuth(); } catch { /* noop */ } };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [checkAuth]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(1, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div
      data-testid="email-verification-wall"
      className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6 overflow-auto"
    >
      <div className="w-full max-w-lg text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#25D366]/10 mb-6">
          <MailCheck className="w-10 h-10 text-[#25D366]" strokeWidth={2} />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3" data-testid="wall-title">
          Vérifiez votre adresse email
        </h1>

        <p className="text-gray-600 mb-2">
          Nous avons envoyé un lien de vérification à :
        </p>

        {user?.email && (
          <p
            className="font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 inline-block mb-6 text-gray-800"
            data-testid="wall-email"
          >
            {user.email}
          </p>
        )}

        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Cliquez sur le lien reçu pour activer votre compte. <br />
          Pensez à regarder dans le dossier <strong>spam / courrier indésirable</strong> si vous ne le voyez pas.
        </p>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6 text-left text-sm text-amber-900">
          <strong>Accès bloqué.</strong> Tant que votre email n'est pas vérifié, vous ne pouvez ni naviguer sur la boutique, ni utiliser votre compte. C'est une mesure anti-spam qui nous permet de vous envoyer les bons emails sans être marqué comme indésirable.
        </div>

        {feedback && (
          <div
            data-testid="wall-feedback"
            className={`mb-4 p-3 rounded-lg text-sm border ${
              feedback.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : feedback.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {feedback.message}
          </div>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={secondsLeft > 0 || resending}
          data-testid="wall-resend-btn"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#25D366] text-white font-semibold shadow-sm hover:bg-[#128C7E] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {resending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {secondsLeft > 0
            ? `Renvoyer dans ${mm}:${ss}`
            : "Renvoyer l'email de vérification"}
        </button>

        <div className="mt-8">
          <button
            type="button"
            onClick={logout}
            data-testid="wall-logout-btn"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 underline underline-offset-4"
          >
            <LogOut className="w-4 h-4" />
            Me déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
