import React, { useState } from 'react';
import { Link2, Copy, Check, Share2, MessageCircle } from 'lucide-react';

/**
 * Reusable "share my shop" card shown on the vendor dashboard and profile.
 * Builds the absolute public URL of the shop from its slug, exposes a
 * one-click copy button and a native share button when available.
 */
export default function ShareShopCard({ slug, shopName }) {
  const [copied, setCopied] = useState(false);

  if (!slug) return null;

  // Absolute URL is what the vendor actually wants to paste elsewhere.
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = `${base}/boutiques/${slug}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        // Legacy browsers fallback
        const ta = document.createElement('textarea');
        ta.value = fullUrl;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* no-op */ }
  };

  const handleShare = async () => {
    const shareData = {
      title: shopName ? `Boutique ${shopName} sur Washop` : 'Ma boutique sur Washop',
      text: shopName ? `Découvrez ${shopName} sur Washop` : 'Découvrez ma boutique sur Washop',
      url: fullUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopy();
      }
    } catch { /* user cancelled or not supported */ }
  };

  const whatsappText = encodeURIComponent(
    shopName
      ? `Salut ! 👋 Découvre ma boutique ${shopName} sur Washop : ${fullUrl}`
      : `Salut ! 👋 Découvre ma boutique sur Washop : ${fullUrl}`
  );

  return (
    <div className="glass p-4" data-testid="share-shop-card">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-[#25D366]" />
        <h3 className="font-bold text-sm">Partager ma boutique</h3>
      </div>

      <p className="text-xs text-gray-500 mb-3">
        Partagez ce lien à vos clients pour qu'ils découvrent votre boutique Washop en un clic.
      </p>

      <div className="flex items-stretch gap-2 mb-3">
        <div
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-700 truncate"
          title={fullUrl}
          data-testid="share-shop-url"
        >
          {fullUrl}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          data-testid="share-shop-copy-btn"
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
            copied
              ? 'bg-[#25D366]/15 text-[#25D366]'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="share-shop-whatsapp-btn"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#25D366] text-white hover:bg-[#128C7E] transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </a>
        <button
          type="button"
          onClick={handleShare}
          data-testid="share-shop-native-btn"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Partager…
        </button>
      </div>
    </div>
  );
}
