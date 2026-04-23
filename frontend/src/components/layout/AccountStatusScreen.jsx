import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert, Clock } from 'lucide-react';

/**
 * Full-screen blocker shown when the currently logged-in user is either
 * banned or suspended. The app stays mounted (session alive), but every
 * interactive surface is hidden behind this overlay. Only the logout
 * button is reachable.
 */
export default function AccountStatusScreen({ status }) {
  const { user, logout } = useAuth();
  const isBanned = status === 'banned';

  const palette = isBanned
    ? {
        accent: '#b91c1c',
        accentSoft: '#fee2e2',
        Icon: ShieldAlert,
        title: 'Compte banni',
        subtitle: "L'accès à Washop a été définitivement révoqué pour ce compte.",
        hint: "Si vous pensez qu'il s'agit d'une erreur, contactez le support Washop depuis votre adresse email enregistrée.",
      }
    : {
        accent: '#b45309',
        accentSoft: '#fef3c7',
        Icon: Clock,
        title: 'Compte suspendu',
        subtitle: "Votre compte est temporairement suspendu par l'administration.",
        hint: "Pendant la suspension, votre boutique n'est plus visible et vos actions sont bloquées. Contactez le support pour en savoir plus.",
      };

  const { Icon } = palette;

  return (
    <div
      data-testid={`account-status-screen-${status}`}
      className="fixed inset-0 z-[9999] bg-white flex items-center justify-center p-6 overflow-auto"
    >
      <div className="w-full max-w-lg text-center">
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{ backgroundColor: palette.accentSoft }}
        >
          <Icon size={40} style={{ color: palette.accent }} strokeWidth={2} />
        </div>

        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight mb-3"
          style={{ color: palette.accent }}
          data-testid="account-status-title"
        >
          {palette.title}
        </h1>

        <p className="text-gray-700 text-base md:text-lg mb-4" data-testid="account-status-subtitle">
          {palette.subtitle}
        </p>

        {user?.email && (
          <p className="text-sm text-gray-500 mb-6">
            Compte concerné :{' '}
            <span className="font-mono text-gray-800">{user.email}</span>
          </p>
        )}

        <div
          className="rounded-xl p-4 mb-8 text-sm text-left text-gray-700 border"
          style={{ backgroundColor: palette.accentSoft, borderColor: palette.accent + '33' }}
        >
          {palette.hint}
        </div>

        <button
          type="button"
          onClick={logout}
          data-testid="account-status-logout-btn"
          className="w-full md:w-auto px-8 py-3 rounded-full bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
        >
          Me déconnecter
        </button>

        <p className="mt-8 text-xs text-gray-400">
          Wa<span style={{ color: '#25D366' }}>shop</span> · Marketplace WhatsApp
        </p>
      </div>
    </div>
  );
}
