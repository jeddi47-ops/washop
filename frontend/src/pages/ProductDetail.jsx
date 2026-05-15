import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { products as productsApi, reviews as reviewsApi, vendors as vendorsApi, orders as ordersApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useLang } from '../contexts/LangContext';
import ProductCard, { SkeletonCard, CURRENCY_SYMBOLS } from '../components/shared/ProductCard';
import { Star, MessageCircle, ShoppingBag, ChevronLeft, ChevronRight, ShieldCheck, Loader2, Send } from 'lucide-react';

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
  const [clientOrders, setClientOrders] = useState([]);

  useEffect(() => {
    setLoading(true);
    productsApi.get(id, true).then(async (r) => {
      const p = r.data.data;
      setProduct(p);
      setImgIdx(0);
      try { const v = await vendorsApi.get(p.vendor_id); setVendor(v.data.data); } catch {}
      try { const rv = await reviewsApi.product(p.id, { limit: 20 }); setPReviews(rv.data.data || []); } catch {}
      try { const s = await productsApi.list({ category_id: p.category_id, limit: 8 }); setSimilar((s.data.data || []).filter(x => x.id !== p.id)); } catch {}
      // Fetch client's orders with this vendor to enable reviews
      if (user?.role === 'client') {
        try { const o = await ordersApi.me({ limit: 50 }); setClientOrders((o.data.data || []).filter(x => x.vendor_id === p.vendor_id && x.status !== 'cancelled')); } catch {}
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]); // eslint-disable-line

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6"><div className="aspect-square animate-shimmer rounded-xl" /><div className="space-y-4"><div className="h-8 w-3/4 animate-shimmer rounded" /><div className="h-6 w-1/3 animate-shimmer rounded" /><div className="h-20 animate-shimmer rounded" /></div></div></div>;
  if (!product) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-500">Produit non trouve</div>;

  const images = product.images || [];
  const hasFlash = !!product.flash_sale;
  const hasPromo = !hasFlash && product.promo_price && product.promo_price < product.price;
  const price = hasFlash ? product.flash_sale.discounted_price : hasPromo ? product.promo_price : product.price;
  const sym = CURRENCY_SYMBOLS[product?.currency] ?? product?.currency ?? '$';
  const inStock = product.stock > 0;
  const avgRating = pReviews.length > 0 ? (pReviews.reduce((s, r) => s + r.rating, 0) / pReviews.length) : 0;

  const handleAddCart = () => { if (vendor) addItem(product, vendor, qty); };

  const handleWhatsApp = async () => {
    if (!user) { window.location.href = `/login?redirect=/products/${id}`; return; }
    setOrdering(true);
    try {
      const genId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); });
      const { data } = await ordersApi.create({ vendor_id: product.vendor_id, items: [{ product_id: product.id, quantity: qty }], idempotency_key: genId() });
      if (data.data?.whatsapp_url) window.open(data.data.whatsapp_url, '_blank');
      if (data.data?.id) try { await ordersApi.whatsappRedirect(data.data.id); } catch {}
    } catch (err) { alert(err.response?.data?.detail || 'Erreur'); }
    setOrdering(false);
  };

  const onReviewSubmitted = (newReview) => {
    setPReviews(prev => [newReview, ...prev]);
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="product-detail">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          {/* Gallery */}
          <div>
            <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
              {images.length > 0 ? <img src={images[imgIdx]?.cloudinary_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag className="w-20 h-20" /></div>}
              {images.length > 1 && <>
                <button onClick={() => setImgIdx(i => i > 0 ? i - 1 : images.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition shadow"><ChevronLeft className="w-4 h-4 text-gray-700" /></button>
                <button onClick={() => setImgIdx(i => i < images.length - 1 ? i + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition shadow"><ChevronRight className="w-4 h-4 text-gray-700" /></button>
              </>}
              {hasFlash && <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">-{product.flash_sale.discount_percentage}%</span>}
              {hasPromo && <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">PROMO</span>}
              {product.is_featured && !hasFlash && !hasPromo && <span className="absolute top-3 left-3 bg-yellow-400 text-white text-xs font-bold px-3 py-1 rounded-full">⭐ Populaire</span>}
            </div>
            {images.length > 1 && <div className="flex gap-2 overflow-x-auto scrollbar-hide">{images.map((img, i) => <button key={i} onClick={() => setImgIdx(i)} className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition ${i === imgIdx ? 'border-[#25D366]' : 'border-gray-200'}`}><img src={img.cloudinary_url} alt="" className="w-full h-full object-cover" /></button>)}</div>}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

            {/* Rating summary */}
            {pReviews.length > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}</div>
                <span className="text-sm text-gray-600 font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({pReviews.length} {t.product.reviews})</span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${inStock ? 'bg-green-50 text-[#25D366]' : 'bg-red-50 text-red-500'}`}>{inStock ? t.product.in_stock : t.product.out_of_stock} ({product.stock})</span>
            </div>
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-extrabold text-[#25D366]">{price?.toFixed(2)} {sym}</span>
              {(hasFlash || hasPromo) && <span className="text-lg text-gray-400 line-through">{product.price?.toFixed(2)} {sym}</span>}
            </div>

            {/* Vendor card */}
            {vendor && (
              <Link to={`/boutiques/${vendor.shop_slug}`} className="glass p-3 flex items-center gap-3 mb-6 hover:border-[#25D366] hover:shadow-md transition">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-[#25D366] font-bold">{vendor.shop_name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">{vendor.shop_name} {vendor.is_verified && <ShieldCheck className="w-4 h-4 text-[#25D366]" />}</p>
                  <div className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /><span className="text-xs text-gray-500">{vendor.avg_vendor_rating?.toFixed(1)}</span></div>
                </div>
                <span className="text-xs text-[#25D366]">{t.product.see_shop} &rarr;</span>
              </Link>
            )}

            {/* Qty + Actions */}
            {inStock && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-500">Qte:</label>
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
            {['desc', 'product_reviews'].map(k => (
              <button key={k} onClick={() => setTab(k)} className={`pb-3 text-sm font-semibold transition border-b-2 ${tab === k ? 'border-[#25D366] text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                {k === 'desc' ? t.product.description : `${t.product.product_reviews} (${pReviews.length})`}
              </button>
            ))}
          </div>

          {tab === 'desc' && <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description || 'Aucune description.'}</p>}

          {tab === 'product_reviews' && (
            <div>
              {/* Review form for clients */}
              {user?.role === 'client' && clientOrders.length > 0 && (
                <WriteReviewForm productId={product.id} vendorId={product.vendor_id} orders={clientOrders} onSubmitted={onReviewSubmitted} />
              )}
              {user?.role === 'client' && clientOrders.length === 0 && (
                <div className="glass p-4 mb-6 text-center text-sm text-gray-500 bg-gray-50">
                  Commandez ce produit pour pouvoir laisser un avis
                </div>
              )}
              {!user && (
                <div className="glass p-4 mb-6 text-center text-sm text-gray-500 bg-gray-50">
                  <Link to={`/login?redirect=/products/${id}`} className="text-[#25D366] font-semibold hover:underline">Connectez-vous</Link> pour laisser un avis
                </div>
              )}

              {/* Reviews list */}
              {pReviews.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Aucun avis pour le moment. Soyez le premier !</p>
              ) : (
                <div className="space-y-3">
                  {pReviews.map((r, i) => <ReviewCard key={r.id || i} review={r} />)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Similar */}
        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t.product.similar}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{similar.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =================== WRITE REVIEW FORM =================== */
function WriteReviewForm({ productId, vendorId, orders, onSubmitted }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (done) {
    return (
      <div className="glass p-4 mb-6 text-center bg-green-50 border-green-200">
        <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-800">Merci pour votre avis !</p>
        <p className="text-xs text-gray-500 mt-1">Il sera visible apres moderation.</p>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="glass p-4 mb-6 w-full text-left hover:border-[#25D366] hover:shadow-md transition group" data-testid="write-review-btn">
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-gray-200 group-hover:text-yellow-300 transition" />)}
          </div>
          <span className="text-sm text-gray-500 group-hover:text-[#25D366] transition font-medium">Donnez votre avis...</span>
        </div>
      </button>
    );
  }

  const submit = async () => {
    if (!selectedOrder) { setError('Selectionnez une commande'); return; }
    if (rating === 0) { setError('Choisissez une note'); return; }
    setError(''); setLoading(true);
    try {
      const { data } = await reviewsApi.create({ order_id: selectedOrder, type: 'product', target_id: productId, rating, comment });
      setDone(true);
      if (onSubmitted && data.data) onSubmitted(data.data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Erreur lors de la soumission');
    }
    setLoading(false);
  };

  return (
    <div className="glass p-5 mb-6 animate-fade-in" data-testid="review-form">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-yellow-400" /> Donner votre avis</h3>

      {error && <div className="p-3 mb-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

      {/* Order selector */}
      <div className="mb-4">
        <label className="text-sm text-gray-500 mb-1.5 block">Commande associee</label>
        <select value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)} className="!text-sm" data-testid="review-order-select">
          <option value="">Selectionnez une commande...</option>
          {orders.map(o => <option key={o.id} value={o.id}>#{o.id?.slice(-8)} — {new Date(o.created_at).toLocaleDateString()}</option>)}
        </select>
      </div>

      {/* Star rating */}
      <div className="mb-4">
        <label className="text-sm text-gray-500 mb-1.5 block">Votre note</label>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(i => (
            <button key={i} type="button" onMouseEnter={() => setHoverRating(i)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(i)} className="p-0.5 transition hover:scale-110" data-testid={`star-${i}`}>
              <Star className={`w-7 h-7 transition ${i <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
            </button>
          ))}
          {rating > 0 && <span className="ml-2 text-sm text-gray-500 self-center">{rating}/5</span>}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="text-sm text-gray-500 mb-1.5 block">Commentaire (optionnel)</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Partagez votre experience..." className="!text-sm" maxLength={2000} data-testid="review-comment" />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={() => setExpanded(false)} className="btn-secondary flex-1 !text-sm">Annuler</button>
        <button onClick={submit} disabled={loading || rating === 0} className="btn-primary flex-1 !text-sm flex items-center justify-center gap-2" data-testid="submit-review-btn">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publier
        </button>
      </div>
    </div>
  );
}

/* =================== REVIEW CARD =================== */
function ReviewCard({ review }) {
  return (
    <div className="glass p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}</div>
        <span className="text-xs text-gray-400">{review.rating}/5</span>
      </div>
      {review.comment && <p className="text-sm text-gray-700 mb-2">{review.comment}</p>}
      <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
  );
}
