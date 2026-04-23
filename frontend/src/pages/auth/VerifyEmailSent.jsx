import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MailCheck, Loader2, RefreshCw } from 'lucide-react';
import { auth as authApi } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Shown right after a successful registration. Tells the user that a
 * verification email has been sent and offers a way to resend it.
 */
export default function VerifyEmailSent() {
  const location = useLocation();
  const { user } = useAuth();
  const email = location.state?.email || user?.email || '';

  const [resending, setResending] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleResend = async () => {
    setResending(true);
    setFeedback(null);
    try {
      const { data } = await authApi.resendVerification();
      setFeedback({ type: 'success', message: data?.message || 'Email renvoyé' });
    } catch (err) {
      const d = err.response?.data?.detail;
      setFeedback({
        type: 'error',
        message: typeof d === 'string' ? d : "Impossible de renvoyer l'email pour le moment. Réessayez dans une minute.",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10"
      data-testid="verify-email-sent-page"
    >
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#25D366]/10 mb-6">
          <MailCheck className="w-10 h-10 text-[#25D366]" strokeWidth={2} />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3" data-testid="verify-email-sent-title">
          Vérifiez votre boîte mail
        </h1>

        <p className="text-gray-600 mb-2">
          Nous venons d'envoyer un lien de vérification à :
        </p>

        {email && (
          <p className="font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg py-2 px-4 inline-block mb-6 text-gray-800" data-testid="verify-email-sent-address">
            {email}
          </p>
        )}

        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          Cliquez sur le lien dans l'email pour activer votre compte. Le lien est valable <strong>24 heures</strong>.
          <br />
          Pensez à vérifier votre dossier <strong>spam / courrier indésirable</strong> si vous ne trouvez rien.
        </p>

        {feedback && (
          <div
            data-testid="verify-email-sent-feedback"
            className={`mb-4 p-3 rounded-lg text-sm border ${
              feedback.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {user && !user.email_verified && (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            data-testid="verify-email-sent-resend-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            {resending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Renvoyer l'email de vérification
          </button>
        )}

        <p className="mt-8 text-sm text-gray-500">
          <Link to="/" className="text-[#25D366] hover:underline font-medium">
            Retour à l'accueil
          </Link>
        </p>
      </div>
    </div>
  );
}
