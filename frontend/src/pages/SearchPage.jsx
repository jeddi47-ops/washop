import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { search as searchApi } from '../lib/api';
import { useLang } from '../contexts/LangContext';
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard';
import { Search, Store, ShieldCheck, Star, Package, Sparkles } from 'lucide-react';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const { t } = useLang();

  // Products (existing behaviour)
  const [products, setProducts] = useState([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsPage, setProductsPage] = useState(1);

  // Shops (new)
  const [shops, setShops] = useState([]);
  const [shopsTotal, setShopsTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    setLoading(true);

    // Fetch both in parallel; neither blocks the other if one fails.
    Promise.allSettled([
      searchApi.query({ q, page: 1, limit: 20 }),
      searchApi.shops({ q, page: 1, limit: 10 }),
    ]).then(([pRes, sRes]) => {
      if (pRes.status === 'fulfilled') {
        setProducts(pRes.value.data.data || []);
        setProductsTotal(pRes.value.data.total || 0);
        setProductsPage(1);
      } else {
        setProducts([]); setProductsTotal(0);
      }
      if (sRes.status === 'fulfilled') {
        setShops(sRes.value.data.data || []);
        setShopsTotal(sRes.value.data.total || 0);
      } else {
        setShops([]); setShopsTotal(0);
      }
      setLoading(false);
    });
  }, [q]);

  const loadMoreProducts = async () => {
    const next = productsPage + 1;
    try {
      const r = await searchApi.query({ q, page: next, limit: 20 });
      setProducts(prev => [...prev, ...(r.data.data || [])]);
      setProductsPage(next);
    } catch { /* noop */ }
  };

  const nothingFound = !loading && products.length === 0 && shops.length === 0;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="search-page">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold mb-6">
          {t.search.title} "<span className="text-[#25D366]">{q}</span>"{' '}
          <span className="text-sm text-gray-500 font-normal">
            ({productsTotal + shopsTotal})
          </span>
        </h1>

        {loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array(2).fill(0).map((_, i) => <div key={i} className="h-28 rounded-xl animate-shimmer bg-gray-100" />)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          </div>
        )}

        {nothingFound && (
          <div className="text-center py-20" data-testid="search-empty">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700 mb-2">{t.search.no_results} "{q}"</p>
            <p className="text-sm text-gray-500 mb-6">{t.search.noted}</p>
            <Link to="/" className="btn-primary !px-8">{t.search.explore_all}</Link>
          </div>
        )}

        {!loading && !nothingFound && (
          <>
            {/* SHOPS SECTION */}
            {shops.length > 0 && (
              <section className="mb-10" data-testid="search-shops-section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#25D366]" />
                    Boutiques{' '}
                    <span className="text-sm font-normal text-gray-500">({shopsTotal})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {shops.map(s => <ShopResultCard key={s.id} shop={s} />)}
                </div>
              </section>
            )}

            {/* PRODUCTS SECTION */}
            {products.length > 0 && (
              <section data-testid="search-products-section">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#25D366]" />
                    Produits{' '}
                    <span className="text-sm font-normal text-gray-500">({productsTotal})</span>
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
                {products.length < productsTotal && (
                  <div className="text-center mt-8">
                    <button onClick={loadMoreProducts} className="btn-secondary !px-8">
                      {t.catalog.load_more}
                    </button>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Shop card shown in the search results. Clicking it takes the user to the
 * full ShopPage where products of that shop are displayed.
 */
function ShopResultCard({ shop }) {
  const plan = {
    basic: { label: 'Basic', cls: 'bg-gray-100 text-gray-600' },
    premium: { label: 'Premium', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
    extra: { label: 'Extra', cls: 'bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 border border-orange-200' },
  }[shop.subscription_type];

  return (
    <Link
      to={`/boutiques/${shop.shop_slug}`}
      data-testid="search-shop-card"
      className="group relative flex items-stretch gap-3 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-[#25D366]/40 transition-all"
    >
      {/* Banner strip (left side on desktop, top on mobile visual via aspect) */}
      <div className="relative w-28 sm:w-40 flex-shrink-0 bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] overflow-hidden">
        {shop.banner_url ? (
          <img src={shop.banner_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-30 mix-blend-screen"
            style={{
              backgroundImage: `radial-gradient(at 30% 40%, #25D366 0%, transparent 60%), radial-gradient(at 70% 70%, #128C7E 0%, transparent 60%)`,
            }}
          />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 py-3 pr-3 flex flex-col justify-center">
        <div className="flex items-center gap-2">
          {/* Avatar mini */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0 bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white text-sm font-bold">
            {shop.avatar_url ? (
              <img src={shop.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{shop.shop_name?.[0]?.toUpperCase() || 'W'}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-sm truncate text-gray-900 group-hover:text-[#25D366] transition-colors">
                {shop.shop_name}
              </p>
              {shop.is_verified && (
                <ShieldCheck className="w-3.5 h-3.5 text-[#25D366] flex-shrink-0" />
              )}
              {plan && (
                <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${plan.cls}`}>
                  <Sparkles className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
                  {plan.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {shop.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-1.5">
            {shop.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs">
          <span className="inline-flex items-center gap-1 text-gray-500">
            <Package className="w-3 h-3 text-[#25D366]" />
            <span className="font-semibold">{shop.product_count}</span>
            <span className="text-gray-400">produits</span>
          </span>
          <span className="inline-flex items-center gap-1 text-gray-500">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{(shop.avg_product_rating || 0).toFixed(1)}</span>
          </span>
          <span className="ml-auto text-[11px] text-[#25D366] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
            Voir la boutique →
          </span>
        </div>
      </div>
    </Link>
  );
}
