import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LangContext';
import { products as productsApi, categories as categoriesApi, flashSales, featuredProducts } from '../lib/api';
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard';
import { ArrowRight, Star, ShoppingBag, Store, MessageCircle, Zap, Crown, Sparkles, ChevronLeft, ChevronRight, Check, X as XIcon } from 'lucide-react';

export default function Home() {
  return (
    <div className="animate-fade-in">
      <Hero />
      <FlashSalesSection />
      <FeaturedSection />
      <TrendingSection />
      <Testimonials />
      <CatalogSection />
    </div>
  );
}

/* =================== HERO =================== */
function Hero() {
  const { t } = useLang();
  const navigate = useNavigate();
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden px-4 bg-gradient-to-b from-green-50 via-white to-white" data-testid="hero-section">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-[#25D366]/20 animate-float" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${3 + Math.random() * 4}s` }} />)}
      </div>
      <div className="relative text-center max-w-3xl mx-auto">
        <img src="/logo.png" alt="Washop" className="h-20 w-20 md:h-24 md:w-24 rounded-2xl mx-auto mb-6 object-cover animate-fade-scale" />
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 text-gray-900">
          {t.hero.title.split(' ').map((w, i) => <span key={i} className={w === 'WhatsApp' ? 'text-[#25D366]' : ''}>{w} </span>)}
        </h1>
        <p className="text-base md:text-lg text-gray-500 mb-8 max-w-xl mx-auto">{t.hero.subtitle}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })} className="btn-primary !py-3 !px-8 !text-base animate-pulse-green flex items-center justify-center gap-2" data-testid="explore-btn">
            <ShoppingBag className="w-5 h-5" /> {t.hero.explore}
          </button>
          <button onClick={() => navigate('/register')} className="btn-secondary !py-3 !px-8 !text-base flex items-center justify-center gap-2" data-testid="become-vendor-btn">
            <Store className="w-5 h-5" /> {t.hero.become_vendor}
          </button>
        </div>
      </div>
    </section>
  );
}

/* =================== HOW IT WORKS =================== */
/* =================== HOW IT WORKS =================== */
export function HowItWorks() {
  const { t } = useLang();
  const clientSteps = [
    { icon: <ShoppingBag className="w-7 h-7" />, text: t.how.client_steps[0] },
    { icon: <MessageCircle className="w-7 h-7" />, text: t.how.client_steps[1] },
    { icon: <Check className="w-7 h-7" />, text: t.how.client_steps[2] },
  ];
  const vendorSteps = [
    { icon: <Store className="w-7 h-7" />, text: t.how.vendor_steps[0] },
    { icon: <Sparkles className="w-7 h-7" />, text: t.how.vendor_steps[1] },
    { icon: <Zap className="w-7 h-7" />, text: t.how.vendor_steps[2] },
  ];
  return (
    <section className="py-16 px-4" data-testid="how-section">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">{t.how.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h3 className="text-lg font-bold text-[#25D366] mb-6 text-center">{t.how.client_title}</h3>
            <div className="space-y-4">
              {clientSteps.map((s, i) => (
                <div key={i} className="glass p-4 flex items-center gap-4 hover:border-[#25D366]/30 transition" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] flex-shrink-0">{s.icon}</div>
                  <div><span className="text-xs text-[#25D366] font-bold">0{i + 1}</span><p className="text-sm font-medium">{s.text}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#25D366] mb-6 text-center">{t.how.vendor_title}</h3>
            <div className="space-y-4">
              {vendorSteps.map((s, i) => (
                <div key={i} className="glass p-4 flex items-center gap-4 hover:border-[#25D366]/30 transition" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366] flex-shrink-0">{s.icon}</div>
                  <div><span className="text-xs text-[#25D366] font-bold">0{i + 1}</span><p className="text-sm font-medium">{s.text}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =================== FLASH SALES =================== */
function FlashSalesSection() {
  const { t } = useLang();
  const [sales, setSales] = useState([]);
  useEffect(() => { flashSales.list({ active_only: true, limit: 10 }).then(r => setSales(r.data.data || [])).catch(() => {}); }, []);
  if (!sales.length) return null;
  return (
    <section className="py-12 px-4" data-testid="flash-sales">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold">{t.flash.title}</h2>
          <span className="text-xs font-bold bg-red-500 px-2 py-0.5 rounded-full animate-pulse">{t.flash.limited}</span>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {sales.map(s => (
            <Link to={`/products/${s.product_id}`} key={s.id} className="glass min-w-[200px] max-w-[200px] p-3 flex-shrink-0 hover:border-red-500/30 transition">
              <p className="text-sm font-medium truncate">{s.product?.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#25D366] font-bold">{s.discounted_price?.toFixed(2)} $</span>
                <span className="text-xs text-gray-400 line-through">{s.product?.price?.toFixed(2)} $</span>
              </div>
              <span className="text-xs text-red-400 font-bold">-{s.discount_percentage}%</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =================== FEATURED =================== */
function FeaturedSection() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  useEffect(() => { featuredProducts.list({ limit: 8 }).then(r => setItems(r.data.data || [])).catch(() => {}); }, []);
  if (!items.length) return null;
  return (
    <section className="py-12 px-4" data-testid="featured-section">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Star className="w-6 h-6 text-yellow-400" /> {t.featured.title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {items.map(i => i.product && <div key={i.id} className="glass p-3"><p className="text-sm font-medium truncate">{i.product.name}</p><p className="text-[#25D366] font-bold text-sm">{i.product.price} $</p></div>)}
        </div>
      </div>
    </section>
  );
}

/* =================== PRICING =================== */
export function PricingSection() {
  const { t } = useLang();
  const [annual, setAnnual] = useState(false);
  const checkoutLinks = {
    Basic: { monthly: 'https://nzaofhms.mychariow.shop/prd_fih09v/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_vh8k9t/checkout' },
    Premium: { monthly: 'https://nzaofhms.mychariow.shop/prd_u4c5d3/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_w89k2c/checkout' },
    Extra: { monthly: 'https://nzaofhms.mychariow.shop/prd_mtxh4x/checkout', annual: 'https://nzaofhms.mychariow.shop/prd_dlwst0/checkout' },
  };

  const plans = [
    { name: 'Basic', price: annual ? 96 : 10, icon: <ShoppingBag className="w-6 h-6" />, color: 'gray', features: [{ text: `15 ${t.pricing.products}`, ok: true }, { text: t.pricing.search_priority, ok: false }, { text: t.pricing.daily_featured, ok: false }, { text: t.pricing.promoted_7, ok: false }, { text: t.pricing.search_misses, ok: false }, { text: t.pricing.promo_email, ok: false }, { text: t.pricing.monthly_report, ok: true }] },
    { name: 'Premium', price: annual ? 192 : 20, icon: <Crown className="w-6 h-6" />, color: 'blue', features: [{ text: `${t.pricing.unlimited} ${t.pricing.products}`, ok: true }, { text: t.pricing.search_priority, ok: true }, { text: t.pricing.daily_featured, ok: true }, { text: t.pricing.promoted_7, ok: false }, { text: t.pricing.search_misses, ok: false }, { text: t.pricing.promo_email, ok: false }, { text: t.pricing.monthly_report, ok: true }] },
    { name: 'Extra', price: annual ? 384 : 40, icon: <Sparkles className="w-6 h-6" />, color: 'green', recommended: true, features: [{ text: `${t.pricing.unlimited} ${t.pricing.products}`, ok: true }, { text: t.pricing.search_priority, ok: true }, { text: t.pricing.daily_featured, ok: true }, { text: t.pricing.promoted_7, ok: true }, { text: t.pricing.search_misses, ok: true }, { text: t.pricing.promo_email, ok: true }, { text: t.pricing.monthly_report, ok: true }] },
  ];

  return (
    <section className="py-16 px-4 bg-gray-50" data-testid="pricing-section">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-2">{t.pricing.title}</h2>
        <p className="text-center text-gray-500 mb-8">{t.pricing.subtitle}</p>
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 flex gap-1 rounded-xl">
            <button onClick={() => setAnnual(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${!annual ? 'bg-[#25D366] text-white' : 'text-gray-500'}`}>{t.pricing.monthly}</button>
            <button onClick={() => setAnnual(true)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${annual ? 'bg-[#25D366] text-white' : 'text-gray-500'}`}>{t.pricing.annual} <span className="text-xs text-green-400">(-20%)</span></button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.name} className={`glass p-6 relative ${plan.recommended ? 'border-[#25D366] ring-2 ring-[#25D366]/20 shadow-lg' : ''}`}>
              {plan.recommended && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#25D366] text-xs font-bold px-3 py-1 rounded-full">{t.pricing.recommended}</span>}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.color === 'green' ? 'bg-[#25D366]/10 text-[#25D366]' : plan.color === 'blue' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-50 text-gray-400'}`}>{plan.icon}</div>
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-3xl font-extrabold text-[#25D366] mb-1">{plan.price}$ <span className="text-sm font-normal text-gray-500">{annual ? t.pricing.per_year : t.pricing.per_month}</span></p>
              <div className="space-y-3 mt-6">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {f.ok ? <Check className="w-4 h-4 text-[#25D366] flex-shrink-0" /> : <XIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                    <span className={f.ok ? 'text-gray-700' : 'text-gray-500'}>{f.text}</span>
                  </div>
                ))}
              </div>
              <a href={checkoutLinks[plan.name]?.[annual ? 'annual' : 'monthly']} target="_blank" rel="noreferrer" className={`mt-6 block text-center py-2.5 rounded-lg font-semibold text-sm transition ${plan.recommended ? 'btn-primary' : 'btn-secondary'}`}>{t.pricing.choose}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =================== TRENDING =================== */
function TrendingSection() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { productsApi.list({ sort_by: 'click_count', sort_order: 'desc', limit: 10 }).then(r => { setItems(r.data.data || []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  return (
    <section className="py-12 px-4" data-testid="trending-section">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-orange-400" /> {t.trending.title}</h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {loading ? Array(4).fill(0).map((_, i) => <div key={i} className="min-w-[180px]"><SkeletonCard /></div>) :
            items.map(p => <div key={p.id} className="min-w-[180px] max-w-[180px] flex-shrink-0"><ProductCard product={p} /></div>)}
        </div>
      </div>
    </section>
  );
}

/* =================== TESTIMONIALS =================== */
function Testimonials() {
  const { t } = useLang();
  const reviews = [
    { name: 'Amina K.', role: 'Vendeuse Extra', stars: 5, text: "Washop a transforme mon business. Mes clients commandent directement sur WhatsApp, c'est simple et efficace !" },
    { name: 'Jean-Paul M.', role: 'Vendeur Premium', stars: 5, text: "En 3 mois, j'ai double mes ventes. La visibilite sur Washop est incroyable." },
    { name: 'Sophie L.', role: 'Vendeuse Basic', stars: 4, text: "Tres facile a utiliser. J'ai lance ma boutique en moins de 10 minutes !" },
    { name: 'David N.', role: 'Vendeur Extra', stars: 5, text: "Le rapport des recherches manquees m'aide a savoir exactement quoi vendre. Genial !" },
    { name: 'Marie T.', role: 'Vendeuse Premium', stars: 4, text: "Mes clients adorent commander via WhatsApp. Plus besoin de site web complique." },
  ];
  return (
    <section className="py-16 px-4" data-testid="testimonials-section">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">{t.testimonials.title}</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {reviews.map((r, i) => (
            <div key={i} className="glass p-5 min-w-[280px] max-w-[280px] flex-shrink-0 hover:border-[#25D366]/30 transition" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center gap-1 mb-3">
                {Array(5).fill(0).map((_, j) => <Star key={j} className={`w-4 h-4 ${j < r.stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />)}
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">"{r.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366] font-bold text-sm">{r.name[0]}</div>
                <div><p className="text-sm font-semibold">{r.name}</p><p className="text-xs text-gray-500">{r.role}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =================== CATALOG =================== */
function CatalogSection() {
  const { t } = useLang();
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [catFilter, setCatFilter] = useState('');
  // Default sort: random for a fresh catalogue order on every refresh.
  const [sort, setSort] = useState('random');
  const [sortOrder, setSortOrder] = useState('desc');
  const sentinelRef = React.useRef(null);
  const loadingRef = React.useRef(false);

  const fetchProducts = React.useCallback(async (p = 1, append = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const params = { page: p, limit: 12, sort_by: sort, sort_order: sortOrder };
      if (catFilter) params.category_id = catFilter;
      const { data } = await productsApi.list(params);
      const incoming = data.data || [];
      setItems(prev => {
        if (!append) return incoming;
        // Deduplicate by product id (important when using random sort which
        // can otherwise return the same item twice across pages).
        const seen = new Set(prev.map(p => p.id));
        return [...prev, ...incoming.filter(it => !seen.has(it.id))];
      });
      setTotal(data.total || 0);
      setPage(p);
    } catch {}
    setLoading(false);
    loadingRef.current = false;
  }, [sort, sortOrder, catFilter]);

  useEffect(() => { categoriesApi.list({ limit: 50 }).then(r => setCats(r.data.data || [])).catch(() => {}); }, []);
  useEffect(() => { fetchProducts(1, false); }, [fetchProducts]);

  // Infinite scroll: observe a sentinel at the bottom of the grid. Whenever it
  // becomes visible AND there are more products to load, fetch the next page.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry.isIntersecting) return;
      if (loadingRef.current) return;
      if (items.length >= total) return;
      fetchProducts(page + 1, true);
    }, { rootMargin: '400px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchProducts, items.length, total, page]);

  return (
    <section id="catalog" className="py-12 px-4" data-testid="catalog-section">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">{t.catalog.title}</h2>

        {/* Categories pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-4">
          <button onClick={() => setCatFilter('')} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${!catFilter ? 'bg-[#25D366] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{t.catalog.all}</button>
          {cats.map(c => (
            <button key={c.id} onClick={() => setCatFilter(c.id)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${catFilter === c.id ? 'bg-[#25D366] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{c.name}</button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-2 mb-6">
          <select value={`${sort}:${sortOrder}`} onChange={e => { const [s, o] = e.target.value.split(':'); setSort(s); setSortOrder(o); }} className="!py-2 !px-3 !text-sm !rounded-lg !w-auto">
            <option value="random:desc">Aléatoire</option>
            <option value="created_at:desc">{t.catalog.sort_recent}</option>
            <option value="price:asc">{t.catalog.sort_price_asc}</option>
            <option value="price:desc">{t.catalog.sort_price_desc}</option>
            <option value="click_count:desc">{t.catalog.sort_clicks}</option>
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {loading && items.length === 0 ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />) :
            items.map(p => <ProductCard key={p.id} product={p} />)}
        </div>

        {items.length === 0 && !loading && (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t.catalog.no_products}</p>
          </div>
        )}

        {/* Sentinel for infinite scroll + loader */}
        {items.length > 0 && items.length < total && (
          <div ref={sentinelRef} className="flex justify-center items-center py-8" data-testid="catalog-infinite-sentinel">
            {loading && <div className="w-6 h-6 border-2 border-[#25D366] border-t-transparent rounded-full animate-spin" />}
          </div>
        )}
      </div>
    </section>
  );
}
