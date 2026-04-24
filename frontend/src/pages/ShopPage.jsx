import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { vendors as vendorsApi, products as productsApi, reviews as reviewsApi } from '../lib/api';
import { useLang } from '../contexts/LangContext';
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard';
import ShareShopCard from '../components/shared/ShareShopCard';
import {
  Star, ShieldCheck, Package, MessageSquare, Store,
  Instagram, Facebook, Music2, Calendar, Sparkles,
} from 'lucide-react';

export default function ShopPage() {
  const { slug } = useParams();
  const { t } = useLang();
  const [vendor, setVendor] = useState(null);
  const [prods, setProds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const [vReviews, setVReviews] = useState([]);

  useEffect(() => {
    setLoading(true);
    vendorsApi.getBySlug(slug).then(async (r) => {
      const v = r.data.data;
      setVendor(v);
      try { const p = await productsApi.list({ vendor_id: v.id, limit: 50 }); setProds(p.data.data || []); } catch {}
      try { const rv = await reviewsApi.vendor(v.id, { limit: 20 }); setVReviews(rv.data.data || []); } catch {}
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen pt-16 pb-10 animate-fade-in">
        <div className="w-full aspect-[3/1] max-h-[320px] bg-gray-100 animate-shimmer" />
        <div className="max-w-5xl mx-auto px-4 -mt-12 relative z-10">
          <div className="w-24 h-24 rounded-full bg-gray-200 animate-shimmer border-4 border-white" />
        </div>
        <div className="max-w-5xl mx-auto px-4 mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center text-gray-600">
        Boutique non trouvée
      </div>
    );
  }

  const socials = vendor.social_links || {};
  const planBadge = {
    basic: { label: 'Basic', cls: 'bg-gray-100 text-gray-600' },
    premium: { label: 'Premium', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    extra: { label: 'Extra', cls: 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 border border-orange-200' },
  }[vendor.subscription_type] || null;

  const joined = vendor.created_at
    ? new Date(vendor.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-screen pt-16 pb-10 bg-gray-50/30 animate-fade-in" data-testid="shop-page">
      {/* ============ HERO BANNER ============ */}
      <div className="relative w-full aspect-[3/1] max-h-[340px] overflow-hidden">
        {vendor.banner_url ? (
          <img
            src={vendor.banner_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          /* Beautiful gradient fallback */
          <div className="absolute inset-0 bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364]">
            <div className="absolute inset-0 opacity-30 mix-blend-screen"
              style={{
                backgroundImage: `radial-gradient(at 20% 30%, #25D366 0%, transparent 50%),
                                   radial-gradient(at 80% 70%, #128C7E 0%, transparent 50%)`,
              }}
            />
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        )}
        {/* Bottom fade so the overlapping avatar reads clearly */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-50/50 to-transparent pointer-events-none" />
      </div>

      {/* ============ IDENTITY HEADER (avatar overlaps banner) ============ */}
      <div className="max-w-5xl mx-auto px-4 relative -mt-14 sm:-mt-16 z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Avatar */}
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-xl flex-shrink-0 bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center">
            {vendor.avatar_url ? (
              <img src={vendor.avatar_url} alt={vendor.shop_name} className="w-full h-full object-cover" data-testid="shop-avatar" />
            ) : (
              <span className="text-white text-4xl sm:text-5xl font-extrabold">
                {vendor.shop_name?.[0]?.toUpperCase() || 'W'}
              </span>
            )}
          </div>

          {/* Name + verified + plan */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900"
                data-testid="shop-name"
              >
                {vendor.shop_name}
              </h1>
              {vendor.is_verified && (
                <span
                  className="inline-flex items-center gap-1 text-[#25D366] text-sm font-semibold"
                  title="Vendeur vérifié"
                  data-testid="verified-badge"
                >
                  <ShieldCheck className="w-5 h-5" />
                  Vérifié
                </span>
              )}
              {planBadge && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${planBadge.cls}`}>
                  <Sparkles className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                  {planBadge.label}
                </span>
              )}
            </div>
            {joined && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Sur Washop depuis {joined}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {vendor.description && (
          <p className="mt-5 text-sm sm:text-base text-gray-700 leading-relaxed max-w-2xl">
            {vendor.description}
          </p>
        )}

        {/* Stats chips + socials */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            {(vendor.avg_product_rating || 0).toFixed(1)}
            <span className="text-gray-400 font-normal">note</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
            <Package className="w-3.5 h-3.5 text-[#25D366]" />
            {prods.length}
            <span className="text-gray-400 font-normal">produits</span>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
            <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
            {vReviews.length}
            <span className="text-gray-400 font-normal">avis</span>
          </div>

          {/* Socials */}
          <div className="h-4 w-px bg-gray-200 mx-1" />
          {socials.instagram_url && (
            <a href={socials.instagram_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-[#E4405F] hover:border-[#E4405F]/40 transition-colors shadow-sm">
              <Instagram className="w-4 h-4" />
            </a>
          )}
          {socials.tiktok_url && (
            <a href={socials.tiktok_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-black hover:border-black transition-colors shadow-sm">
              <Music2 className="w-4 h-4" />
            </a>
          )}
          {socials.facebook_url && (
            <a href={socials.facebook_url} target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 bg-white text-gray-500 hover:text-[#1877F2] hover:border-[#1877F2]/40 transition-colors shadow-sm">
              <Facebook className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Share card hidden on mobile since the main CTA is WhatsApp on product */}
        <div className="mt-6 hidden md:block">
          <ShareShopCard slug={vendor.shop_slug} shopName={vendor.shop_name} />
        </div>
      </div>

      {/* ============ TABS + CONTENT ============ */}
      <div className="max-w-5xl mx-auto px-4 mt-10">
        <div className="flex gap-6 border-b border-gray-200 mb-6">
          {[
            { k: 'products', label: 'Produits', icon: Package, count: prods.length },
            { k: 'vendor_reviews', label: 'Avis', icon: MessageSquare, count: vReviews.length },
          ].map(({ k, label, icon: Icon, count }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              data-testid={`shop-tab-${k}`}
              className={`pb-3 inline-flex items-center gap-2 text-sm font-semibold transition border-b-2 ${
                tab === k
                  ? 'border-[#25D366] text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === k ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-gray-100 text-gray-500'}`}>{count}</span>
            </button>
          ))}
        </div>

        {tab === 'products' && (
          prods.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {prods.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <EmptyState
              icon={<Store className="w-12 h-12 text-gray-400" />}
              title="Aucun produit pour le moment"
              subtitle="Ce vendeur n'a pas encore publié de produits. Revenez bientôt !"
            />
          )
        )}

        {tab === 'vendor_reviews' && (
          vReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vReviews.map((r, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow" data-testid="vendor-review">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-0.5">
                      {Array(5).fill(0).map((_, j) => (
                        <Star key={j} className={`w-4 h-4 ${j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquare className="w-12 h-12 text-gray-400" />}
              title="Aucun avis pour l'instant"
              subtitle="Soyez le premier à partager votre expérience après un achat."
            />
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl py-16 px-6 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">{subtitle}</p>
    </div>
  );
}
