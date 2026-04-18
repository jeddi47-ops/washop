import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlist as wishlistApi } from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { Heart, ShoppingBag, Trash2, ChevronLeft } from 'lucide-react';

export default function ClientWishlist() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const fetch = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await wishlistApi.list({ page: p, limit: 20 });
      setItems(p === 1 ? (data.data || []) : prev => [...prev, ...(data.data || [])]);
      setTotal(data.total || 0);
      setPage(p);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(1); }, []);

  const remove = async (productId) => {
    try {
      await wishlistApi.remove(productId);
      setItems(prev => prev.filter(i => i.product_id !== productId));
      setTotal(prev => prev - 1);
    } catch {}
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="client-wishlist">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/client/dashboard" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold">Wishlist <span className="text-sm text-gray-500 font-normal">({total})</span></h1>
        </div>

        {loading && items.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{[1,2,3,4].map(i => <div key={i} className="aspect-square animate-shimmer rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-1">Votre wishlist est vide</p>
            <p className="text-sm text-gray-500 mb-6">Ajoutez des produits qui vous plaisent</p>
            <Link to="/" className="btn-primary">Explorer les boutiques</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(item => (
                <div key={item.id} className="glass p-3 flex gap-3" data-testid={`wish-${item.product_id}`}>
                  <Link to={`/products/${item.product_id}`} className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {item.product?.images?.[0]?.cloudinary_url ? <img src={item.product.images[0].cloudinary_url} alt="" className="w-full h-full object-cover" /> : null}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product_id}`} className="text-sm font-medium hover:text-[#25D366] transition truncate block">{item.product?.name || 'Produit'}</Link>
                    <p className="text-[#25D366] font-bold text-sm mt-0.5">{item.product?.price?.toFixed(2)} $</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => remove(item.product_id)} className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition" data-testid={`remove-wish-${item.product_id}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      {item.product?.is_active && item.product?.stock > 0 && (
                        <button onClick={() => {}} className="p-1.5 rounded-md bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition">
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {items.length < total && <button onClick={() => fetch(page + 1)} className="btn-secondary w-full mt-6">Charger plus</button>}
          </>
        )}
      </div>
    </div>
  );
}
