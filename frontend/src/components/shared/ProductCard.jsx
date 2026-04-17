import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { wishlist as wishlistApi } from '../../lib/api';
import { useLang } from '../../contexts/LangContext';

export default function ProductCard({ product, onWishlistToggle }) {
  const { user } = useAuth();
  const { t } = useLang();
  const img = product.images?.[0]?.cloudinary_url;
  const hasFlash = !!product.flash_sale;
  const price = hasFlash ? product.flash_sale.discounted_price : product.price;

  const toggleWish = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    try {
      if (product.wishlisted) await wishlistApi.remove(product.id);
      else await wishlistApi.add({ product_id: product.id });
      if (onWishlistToggle) onWishlistToggle(product.id);
    } catch {}
  };

  return (
    <Link to={`/products/${product.id}`} className="group block glass overflow-hidden hover:border-[#25D366]/30 transition-all duration-300" data-testid={`product-card-${product.id}`}>
      <div className="relative aspect-square bg-[#1A1A1A] overflow-hidden">
        {img ? <img src={img} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><ShoppingBagIcon /></div>}
        {hasFlash && <span className="absolute top-2 left-2 bg-red-500 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">FLASH</span>}
        {product.vendor_sub && <span className={`absolute top-2 right-10 text-[10px] font-bold px-1.5 py-0.5 rounded ${product.vendor_sub === 'extra' ? 'bg-[#25D366]/20 text-[#25D366]' : product.vendor_sub === 'premium' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'}`}>{product.vendor_sub?.toUpperCase()}</span>}
        {user && <button onClick={toggleWish} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 hover:bg-black/80 transition"><Heart className={`w-4 h-4 ${product.wishlisted ? 'fill-red-500 text-red-500' : 'text-white'}`} /></button>}
      </div>
      <div className="p-3">
        <p className="text-sm font-medium truncate group-hover:text-[#25D366] transition">{product.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[#25D366] font-bold">{price?.toFixed(2)} $</span>
          {hasFlash && <span className="text-xs text-gray-500 line-through">{product.price?.toFixed(2)} $</span>}
        </div>
        {product.avg_rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-gray-400">{product.avg_rating?.toFixed(1)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function ShoppingBagIcon() {
  return <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
}

export function SkeletonCard() {
  return (
    <div className="glass overflow-hidden">
      <div className="aspect-square animate-shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded animate-shimmer" />
        <div className="h-5 w-1/3 rounded animate-shimmer" />
      </div>
    </div>
  );
}
