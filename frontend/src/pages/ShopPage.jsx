import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { vendors as vendorsApi, products as productsApi, reviews as reviewsApi } from '../lib/api';
import { useLang } from '../contexts/LangContext';
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard';
import { Star, ShieldCheck, ExternalLink } from 'lucide-react';

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

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-5xl mx-auto"><div className="h-48 animate-shimmer rounded-xl mb-6" /><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}</div></div></div>;
  if (!vendor) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-600">Boutique non trouvee</div>;

  const socials = vendor.social_links || {};

  return (
    <div className="min-h-screen pt-16 pb-10 animate-fade-in" data-testid="shop-page">
      {/* Banner */}
      <div className="bg-gradient-to-b from-green-50 to-white py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-[#25D366]/20 flex items-center justify-center text-3xl font-bold text-[#25D366] mb-4">{vendor.shop_name?.[0]}</div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">{vendor.shop_name} {vendor.is_verified && <ShieldCheck className="w-6 h-6 text-[#25D366]" />}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {vendor.avg_product_rating?.toFixed(1)}</span>
            <span>{prods.length} produits</span>
            <span>{vReviews.length} avis</span>
          </div>
          {vendor.description && <p className="text-sm text-gray-400 mt-3 max-w-lg">{vendor.description}</p>}
          <div className="flex gap-3 mt-4">
            {socials.instagram_url && <a href={socials.instagram_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#25D366] transition text-sm"><ExternalLink className="w-4 h-4 inline mr-1" />Instagram</a>}
            {socials.tiktok_url && <a href={socials.tiktok_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#25D366] transition text-sm"><ExternalLink className="w-4 h-4 inline mr-1" />TikTok</a>}
            {socials.facebook_url && <a href={socials.facebook_url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-[#25D366] transition text-sm"><ExternalLink className="w-4 h-4 inline mr-1" />Facebook</a>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {['products', 'vendor_reviews'].map(k => (
            <button key={k} onClick={() => setTab(k)} className={`pb-3 text-sm font-semibold transition border-b-2 ${tab === k ? 'border-[#25D366] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>{k === 'products' ? `Produits (${prods.length})` : `Avis (${vReviews.length})`}</button>
          ))}
        </div>

        {tab === 'products' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {prods.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
        {tab === 'vendor_reviews' && (
          <div className="space-y-4">
            {vReviews.length === 0 ? <p className="text-gray-500 text-sm">Aucun avis.</p> :
              vReviews.map((r, i) => (
                <div key={i} className="glass p-4">
                  <div className="flex items-center gap-1 mb-2">{Array(5).fill(0).map((_, j) => <Star key={j} className={`w-3.5 h-3.5 ${j < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />)}</div>
                  <p className="text-sm text-gray-300">{r.comment}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}
