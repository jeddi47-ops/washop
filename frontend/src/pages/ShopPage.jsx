import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { vendors as vendorsApi, products as productsApi, reviews as reviewsApi } from '../lib/api';
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard';
import ShareShopCard from '../components/shared/ShareShopCard';
import {
  Star, ShieldCheck, Package, MessageSquare, Store,
  Instagram, Facebook, Music2, Calendar, Sparkles,
  Search, ChevronRight, Flame, Clock, Tag, Phone,
} from 'lucide-react';

/* ─── Themes ─────────────────────────────────────────────────────────────── */
export const THEMES = {
  emeraude:   { name: 'Emeraude',   primary: '#25D366', dark: '#128C7E', bg: '#f0fdf4', text: '#14532d', card: '#dcfce7' },
  onyx:       { name: 'Onyx',       primary: '#1a1a2e', dark: '#0f0f1a', bg: '#f8f8f8', text: '#1a1a2e', card: '#e8e8e8' },
  ivoire:     { name: 'Ivoire',     primary: '#c9a96e', dark: '#a07840', bg: '#fdf8f0', text: '#5c3d11', card: '#fdf0d5' },
  cobalt:     { name: 'Cobalt',     primary: '#1e3a8a', dark: '#1e2e6a', bg: '#eff6ff', text: '#1e3a8a', card: '#dbeafe' },
  bordeaux:   { name: 'Bordeaux',   primary: '#8b1a4a', dark: '#6b0f36', bg: '#fff0f5', text: '#8b1a4a', card: '#fce7f0' },
  ardoise:    { name: 'Ardoise',    primary: '#334155', dark: '#1e293b', bg: '#f8fafc', text: '#334155', card: '#e2e8f0' },
  aurore:     { name: 'Aurore',     primary: '#c2410c', dark: '#9a3412', bg: '#fff7ed', text: '#7c2d12', card: '#fed7aa' },
  amethyste:  { name: 'Améthyste', primary: '#6d28d9', dark: '#5b21b6', bg: '#f5f3ff', text: '#4c1d95', card: '#ede9fe' },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function getTheme(vendor) {
  return THEMES[vendor?.shop_theme] || THEMES.emeraude;
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function ShopPage() {
  const { slug }   = useParams();

  const [vendor,   setVendor]   = useState(null);
  const [prods,    setProds]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [vReviews, setVReviews] = useState([]);
  const [tab,      setTab]      = useState('products');
  const [search,   setSearch]   = useState('');
  const [catFilter,setCatFilter]= useState('all');
  const [section,  setSection]  = useState('all'); // all | new | promo | hot

  useEffect(() => {
    setLoading(true);
    vendorsApi.getBySlug(slug).then(async (r) => {
      const v = r.data.data;
      setVendor(v);
      try { const p = await productsApi.list({ vendor_id: v.id, limit: 100 }); setProds(p.data.data || []); } catch {}
      try { const rv = await reviewsApi.vendor(v.id, { limit: 20 }); setVReviews(rv.data.data || []); } catch {}
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  const theme = getTheme(vendor);

  // Derive categories from products
  const categories = useMemo(() => {
    const map = {};
    prods.forEach(p => { if (p.category_name && !map[p.category_id]) map[p.category_id] = p.category_name; });
    return Object.entries(map).map(([id, name]) => ({ id, name }));
  }, [prods]);

  // Filter products
  const filtered = useMemo(() => {
    let list = prods;
    if (catFilter !== 'all') list = list.filter(p => p.category_id === catFilter);
    if (search.trim())       list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (section === 'new')   list = list.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (section === 'hot')   list = list.slice().sort((a, b) => (b.click_count || 0) - (a.click_count || 0));
    if (section === 'promo') list = list.filter(p => p.flash_sale);
    return list;
  }, [prods, catFilter, search, section]);

  const recommended = useMemo(() =>
    prods.slice().sort((a, b) => (b.click_count || 0) - (a.click_count || 0)).slice(0, 6),
  [prods]);

  if (loading) return <LoadingSkeleton />;
  if (!vendor) return (
    <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">
      Boutique non trouvée
    </div>
  );

  const socials  = vendor.social_links || {};
  const joined   = vendor.created_at
    ? new Date(vendor.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;
  const planBadge = {
    basic:   { label: 'Basic',   cls: 'bg-gray-100 text-gray-600' },
    premium: { label: 'Premium', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    extra:   { label: 'Extra',   cls: 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 border border-orange-200' },
  }[vendor.subscription_type] || null;

  const waLink = `https://wa.me/${vendor.whatsapp_number?.replace(/\D/g, '')}`;

  return (
    <div
      className="min-h-screen pt-16 pb-16 animate-fade-in"
      style={{ backgroundColor: theme.bg }}
      data-testid="shop-page"
    >
      {/* ══════════════════ HERO BANNER ══════════════════════════════════════ */}
      <div className="relative w-full overflow-hidden" style={{ height: 280 }}>
        {vendor.banner_url ? (
          <img src={vendor.banner_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, ${theme.dark} 0%, ${theme.primary} 100%)`,
          }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.5'%3E%3Ccircle cx='3' cy='3' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
            />
          </div>
        )}
        {/* Hero text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }}>
          <h1 className="text-5xl md:text-7xl font-black text-white/20 tracking-tighter select-none pointer-events-none">
            {vendor.shop_name}
          </h1>
        </div>
      </div>

      {/* ══════════════════ IDENTITY STRIP ═══════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 relative -mt-14 z-10">
        <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 flex-shrink-0 flex items-center justify-center font-black text-4xl text-white shadow-md"
            style={{ borderColor: theme.primary, background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }}>
            {vendor.avatar_url
              ? <img src={vendor.avatar_url} alt={vendor.shop_name} className="w-full h-full object-cover" data-testid="shop-avatar" />
              : vendor.shop_name?.[0]?.toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-extrabold text-gray-900" data-testid="shop-name">{vendor.shop_name}</h2>
              {vendor.is_verified && (
                <span className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: theme.primary }} data-testid="verified-badge">
                  <ShieldCheck className="w-4 h-4" /> Vérifié
                </span>
              )}
              {planBadge && (
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${planBadge.cls}`}>
                  <Sparkles className="w-3 h-3 inline mr-0.5 -mt-0.5" />{planBadge.label}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-2">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                {(vendor.avg_product_rating || 0).toFixed(1)} note
              </span>
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                {prods.length} produits
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                {vReviews.length} avis
              </span>
              {joined && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Depuis {joined}
                </span>
              )}
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2">
              {socials.instagram_url && (
                <a href={socials.instagram_url} target="_blank" rel="noreferrer"
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#E4405F] transition">
                  <Instagram className="w-3.5 h-3.5" />
                </a>
              )}
              {socials.tiktok_url && (
                <a href={socials.tiktok_url} target="_blank" rel="noreferrer"
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-black transition">
                  <Music2 className="w-3.5 h-3.5" />
                </a>
              )}
              {socials.facebook_url && (
                <a href={socials.facebook_url} target="_blank" rel="noreferrer"
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#1877F2] transition">
                  <Facebook className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* CTA WhatsApp */}
          <a href={waLink} target="_blank" rel="noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md hover:opacity-90 transition"
            style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.dark})` }}>
            <Phone className="w-4 h-4" />
            Contacter
          </a>
        </div>

        {/* Description */}
        {vendor.description && (
          <p className="mt-4 text-sm text-gray-600 leading-relaxed max-w-2xl px-1">
            {vendor.description}
          </p>
        )}

        <div className="mt-4 hidden md:block">
          <ShareShopCard slug={vendor.shop_slug} shopName={vendor.shop_name} />
        </div>
      </div>

      {/* ══════════════════ MAIN CONTENT ═════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex gap-6">

          {/* ── Category sidebar (desktop) ─────────────────────────────────── */}
          {categories.length > 0 && (
            <aside className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">Catégories</p>
              <button
                onClick={() => setCatFilter('all')}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition text-left"
                style={{ background: catFilter === 'all' ? theme.card : 'transparent', color: catFilter === 'all' ? theme.primary : '#6b7280' }}
              >
                <Store className="w-4 h-4 flex-shrink-0" /> Tout voir
                <span className="ml-auto text-xs">{prods.length}</span>
              </button>
              {categories.map(c => (
                <button key={c.id} onClick={() => setCatFilter(c.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition text-left"
                  style={{ background: catFilter === c.id ? theme.card : 'transparent', color: catFilter === c.id ? theme.primary : '#6b7280' }}
                >
                  <Tag className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{c.name}</span>
                  <span className="ml-auto text-xs">{prods.filter(p => p.category_id === c.id).length}</span>
                </button>
              ))}

              <div className="mt-6 p-4 rounded-2xl" style={{ background: theme.card }}>
                <p className="text-xs font-bold mb-1" style={{ color: theme.text }}>Commander ?</p>
                <p className="text-xs text-gray-500 mb-3">Contactez directement le vendeur sur WhatsApp.</p>
                <a href={waLink} target="_blank" rel="noreferrer"
                  className="block text-center py-2 rounded-xl text-white text-xs font-bold"
                  style={{ background: theme.primary }}>
                  WhatsApp →
                </a>
              </div>
            </aside>
          )}

          {/* ── Right panel ───────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-5">
              {[
                { k: 'products', label: 'Produits', icon: Package },
                { k: 'vendor_reviews', label: 'Avis', icon: MessageSquare },
              ].map(({ k, label, icon: Icon }) => (
                <button key={k} onClick={() => setTab(k)} data-testid={`shop-tab-${k}`}
                  className="pb-3 flex items-center gap-1.5 text-sm font-semibold border-b-2 transition"
                  style={{ borderColor: tab === k ? theme.primary : 'transparent', color: tab === k ? theme.primary : '#9ca3af' }}>
                  <Icon className="w-4 h-4" />{label}
                </button>
              ))}
            </div>

            {tab === 'products' && (
              <>
                {/* Search + section filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher dans la boutique..."
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white outline-none transition"
                      style={{ '--tw-ring-color': theme.primary }}
                      onFocus={e => e.target.style.borderColor = theme.primary}
                      onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* Mobile category chips */}
                  <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
                    {[{ id: 'all', name: 'Tous' }, ...categories].map(c => (
                      <button key={c.id} onClick={() => setCatFilter(c.id)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition"
                        style={{
                          background: catFilter === c.id ? theme.primary : '#fff',
                          color: catFilter === c.id ? '#fff' : '#6b7280',
                          borderColor: catFilter === c.id ? theme.primary : '#e5e7eb',
                        }}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section pills */}
                <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                  {[
                    { k: 'all',   label: 'Tout',        icon: Store },
                    { k: 'new',   label: 'Nouveautés',  icon: Clock },
                    { k: 'hot',   label: 'Populaires',  icon: Flame },
                    { k: 'promo', label: 'Promotions',  icon: Tag },
                  ].map(({ k, label, icon: Icon }) => (
                    <button key={k} onClick={() => setSection(k)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition"
                      style={{
                        background: section === k ? theme.primary : '#fff',
                        color: section === k ? '#fff' : '#6b7280',
                        borderColor: section === k ? theme.primary : '#e5e7eb',
                      }}>
                      <Icon className="w-3.5 h-3.5" />{label}
                    </button>
                  ))}
                </div>

                {/* Product grid */}
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filtered.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                ) : (
                  <EmptyState icon={<Store className="w-12 h-12 text-gray-300" />}
                    title="Aucun produit trouvé"
                    subtitle={search ? `Aucun résultat pour "${search}"` : 'Cette section est vide pour le moment.'} />
                )}

                {/* Recommended section */}
                {recommended.length > 0 && !search && section === 'all' && catFilter === 'all' && (
                  <div className="mt-12">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-extrabold text-gray-900 text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5" style={{ color: theme.primary }} />
                        Coups de cœur
                      </h3>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        Les plus vus <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {recommended.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                  </div>
                )}
              </>
            )}

            {tab === 'vendor_reviews' && (
              vReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vReviews.map((r, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm" data-testid="vendor-review">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex gap-0.5">
                          {Array(5).fill(0).map((_, j) => (
                            <Star key={j} className={`w-4 h-4 ${j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={<MessageSquare className="w-12 h-12 text-gray-300" />}
                  title="Aucun avis pour l'instant"
                  subtitle="Soyez le premier à laisser un avis après votre achat." />
              )
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════ FOOTER BOUTIQUE ══════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 mt-16">
        <div className="rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ background: `linear-gradient(135deg, ${theme.dark} 0%, ${theme.primary} 100%)` }}>
          <div>
            <p className="text-white font-extrabold text-xl mb-1">{vendor.shop_name}</p>
            <p className="text-white/70 text-sm">Commandez vos produits directement sur WhatsApp</p>
          </div>
          <a href={waLink} target="_blank" rel="noreferrer"
            className="flex-shrink-0 flex items-center gap-2 bg-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-transform"
            style={{ color: theme.primary }}>
            <Phone className="w-4 h-4" />
            Commander sur WhatsApp
          </a>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Boutique propulsée par <span className="font-bold">Wa<span style={{ color: theme.primary }}>shop</span></span> · washop.app
        </p>
      </div>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl py-16 px-6 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-50 mb-4">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">{subtitle}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen pt-16 pb-10 bg-gray-50 animate-fade-in">
      <div className="w-full bg-gray-200 animate-pulse" style={{ height: 280 }} />
      <div className="max-w-6xl mx-auto px-4 -mt-14 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-5 flex gap-4">
          <div className="w-24 h-24 rounded-2xl bg-gray-200 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
          </div>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}
