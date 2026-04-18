import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { products as productsApi, reviews as reviewsApi, vendors as vendorsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LangContext';
import ProductCard, { SkeletonCard } from '../components/shared/ProductCard';
import { Star, Heart, MessageCircle, ShoppingBag, ChevronLeft, ChevronRight, ShieldCheck, Loader2 } from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { t } = useLang();
  const [product, setProduct] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [pReviews, setPReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [tab, setTab] = useState('desc');
  const [qty, setQty] = useState(1);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    setLoading(true);
    productsApi.get(id, true).then(async (r) => {
      const p = r.data.data;
      setProduct(p);
      setImgIdx(0);
      try { const v = await vendorsApi.get(p.vendor_id); setVendor(v.data.data); } catch {}
      try { const rv = await reviewsApi.product(p.id, { limit: 10 }); setPReviews(rv.data.data || []); } catch {}
      try { const s = await productsApi.list({ category_id: p.category_id, limit: 8 }); setSimilar((s.data.data || []).filter(x => x.id !== p.id)); } catch {}
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6"><div className="aspect-square animate-shimmer rounded-xl" /><div className="space-y-4"><div className="h-8 w-3/4 animate-shimmer rounded" /><div className="h-6 w-1/3 animate-shimmer rounded" /><div className="h-20 animate-shimmer rounded" /></div></div></div>;
  if (!product) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-600">Produit non trouve</div>;

  const images = product.images || [];
  const hasFlash = !!product.flash_sale;
  const price = hasFlash ? product.flash_sale.discounted_price : product.price;
  const inStock = product.stock > 0;

  const handleAddCart = () => { if (vendor) addItem(product, vendor, qty); };

  const handleWhatsApp = async () => {
    if (!user) { window.location.href = `/login?redirect=/products/${id}`; return; }
    setOrdering(true);
    try {
      const { orders } = await import('../lib/api');
      const genId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
      const { data } = await orders.create({ vendor_id: product.vendor_id, items: [{ product_id: product.id, quantity: qty }], idempotency_key: genId() });
      if (data.data?.whatsapp_url) window.open(data.data.whatsapp_url, '_blank');
      if (data.data?.id) try { await orders.whatsappRedirect(data.data.id); } catch {}
    } catch (err) { alert(err.response?.data?.detail || 'Erreur'); }
    setOrdering(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="product-detail">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
              {images.length > 0 ? <img src={images[imgIdx]?.cloudinary_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-500"><ShoppingBag className="w-20 h-20" /></div>}
              {images.length > 1 && <>
                <button onClick={() => setImgIdx(i => i > 0 ? i - 1 : images.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/80 transition"><ChevronLeft className="w-4 h-4" /></button>
                <button onClick={() => setImgIdx(i => i < images.length - 1 ? i + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/80 transition"><ChevronRight className="w-4 h-4" /></button>
              </>}
              {hasFlash && <span className="absolute top-3 left-3 bg-red-500 text-xs font-bold px-3 py-1 rounded-full animate-pulse">-{product.flash_sale.discount_percentage}%</span>}
            </div>
            {images.length > 1 && <div className="flex gap-2 overflow-x-auto scrollbar-hide">{images.map((img, i) => <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${i === imgIdx ? 'border-[#25D366]' : 'border-transparent'}`}><img src={img.cloudinary_url} alt="" className="w-full h-full object-cover" /></button>)}</div>}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${inStock ? 'bg-[#25D366]/10 text-[#25D366]' : 'bg-red-500/10 text-red-400'}`}>{inStock ? t.product.in_stock : t.product.out_of_stock} ({product.stock})</span>
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-extrabold text-[#25D366]">{price?.toFixed(2)} $</span>
              {hasFlash && <span className="text-lg text-gray-500 line-through">{product.price?.toFixed(2)} $</span>}
            </div>

            {/* Vendor card */}
            {vendor && (
              <Link to={`/boutiques/${vendor.shop_slug}`} className="glass p-3 flex items-center gap-3 mb-6 hover:border-[#25D366]/30 transition">
                <div className="w-10 h-10 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366] font-bold">{vendor.shop_name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold flex items-center gap-1">{vendor.shop_name} {vendor.is_verified && <ShieldCheck className="w-4 h-4 text-[#25D366]" />}</p>
                  <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs text-gray-600">{vendor.avg_vendor_rating?.toFixed(1)}</span></div>
                </div>
                <span className="text-xs text-[#25D366]">{t.product.see_shop} &rarr;</span>
              </Link>
            )}

            {/* Qty + Actions */}
            {inStock && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">Qte:</label>
                  <div className="flex items-center glass">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 hover:bg-gray-50 transition">-</button>
                    <span className="px-4 py-2 font-semibold">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="px-3 py-2 hover:bg-gray-50 transition">+</button>
                  </div>
                </div>
                <button onClick={handleWhatsApp} disabled={ordering} className="btn-primary w-full !py-3 flex items-center justify-center gap-2 text-base" data-testid="order-whatsapp-btn">
                  {ordering ? <Loader2 className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-5 h-5" />} {t.product.order_whatsapp}
                </button>
                <button onClick={handleAddCart} className="btn-secondary w-full flex items-center justify-center gap-2" data-testid="add-cart-btn">
                  <ShoppingBag className="w-5 h-5" /> {t.product.add_cart}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-10">
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            {['desc', 'product_reviews', 'vendor_reviews'].map(k => (
              <button key={k} onClick={() => setTab(k)} className={`pb-3 text-sm font-semibold transition border-b-2 ${tab === k ? 'border-[#25D366] text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>{t.product[k === 'desc' ? 'description' : k]}</button>
            ))}
          </div>
          {tab === 'desc' && <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{product.description || 'Aucune description.'}</p>}
          {tab === 'product_reviews' && (
            <div className="space-y-4">{pReviews.length === 0 ? <p className="text-gray-500 text-sm">Aucun avis pour le moment.</p> : pReviews.map((r, i) => <ReviewCard key={i} review={r} />)}</div>
          )}
          {tab === 'vendor_reviews' && <p className="text-gray-500 text-sm">Les avis vendeur apparaitront ici.</p>}
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">{t.product.similar}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{similar.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-1 mb-2">{Array(5).fill(0).map((_, i) => <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />)}</div>
      <p className="text-sm text-gray-300 mb-2">{review.comment}</p>
      <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
    </div>
  );
}
