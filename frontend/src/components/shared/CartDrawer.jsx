import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag, MessageCircle } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { orders } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

function genUUID() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }); }

export default function CartDrawer() {
  const { cart, open, setOpen, updateQty, removeItem, clearCart, total, count, confirmSwitch, cancelSwitch } = useCart();
  const { user } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  const handleOrder = async () => {
    if (!user) { setOpen(false); navigate('/login'); return; }
    setLoading(true);
    try {
      const { data } = await orders.create({
        vendor_id: cart.vendorId,
        items: cart.items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        idempotency_key: genUUID(),
      });
      if (data.data?.whatsapp_url) window.open(data.data.whatsapp_url, '_blank');
      if (data.data?.id) try { await orders.whatsappRedirect(data.data.id); } catch {}
      clearCart();
      setOpen(false);
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur');
    } finally { setLoading(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#111] animate-slide-right flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <h2 className="font-bold text-lg flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> {t.cart.title} ({count})</h2>
          <button onClick={() => setOpen(false)} data-testid="close-cart"><X className="w-5 h-5" /></button>
        </div>

        {cart.needsConfirm && (
          <div className="p-4 bg-yellow-500/10 border-b border-yellow-500/20">
            <p className="text-sm text-yellow-300 mb-3">{t.cart.switch_vendor}</p>
            <div className="flex gap-2">
              <button onClick={cancelSwitch} className="btn-secondary !text-sm flex-1">{t.cart.cancel}</button>
              <button onClick={confirmSwitch} className="btn-primary !text-sm flex-1">{t.cart.clear_continue}</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <ShoppingBag className="w-16 h-16 text-gray-700 mb-4" />
              <p className="text-gray-400 mb-4">{t.cart.empty}</p>
              <button onClick={() => { setOpen(false); navigate('/'); }} className="btn-primary !text-sm">{t.cart.explore}</button>
            </div>
          ) : (
            <>
              {cart.vendorName && (
                <div className="p-3 mx-4 mt-4 rounded-lg bg-white/5 text-sm"><span className="text-gray-400">Boutique:</span> <span className="font-semibold text-[#25D366]">{cart.vendorName}</span></div>
              )}
              <div className="p-4 space-y-3">
                {cart.items.map(item => (
                  <div key={item.product_id} className="flex gap-3 p-3 glass">
                    {item.image ? <img src={item.image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" /> : <div className="w-16 h-16 rounded-lg bg-[#1A1A1A] flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[#25D366] font-bold text-sm">{item.price.toFixed(2)} $</span>
                        {item.flash_sale && <span className="text-xs text-gray-500 line-through">{item.original_price.toFixed(2)} $</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQty(item.product_id, item.quantity - 1)} className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center hover:bg-white/10 transition"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, item.quantity + 1)} disabled={item.quantity >= item.stock} className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center hover:bg-white/10 transition disabled:opacity-30"><Plus className="w-3 h-3" /></button>
                        <button onClick={() => removeItem(item.product_id)} className="ml-auto p-1.5 text-red-400 hover:bg-red-500/10 rounded-md transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {cart.items.length > 0 && (
          <div className="p-4 border-t border-white/5 space-y-3">
            <div className="flex justify-between text-lg font-bold">
              <span>{t.cart.subtotal}</span>
              <span className="text-[#25D366]">{total.toFixed(2)} $</span>
            </div>
            <button onClick={handleOrder} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 !py-3" data-testid="checkout-btn">
              {loading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><MessageCircle className="w-5 h-5" /> {t.cart.order_wa}</>}
            </button>
            <button onClick={() => setOpen(false)} className="btn-secondary w-full !text-sm">{t.cart.continue}</button>
          </div>
        )}
      </div>
    </div>
  );
}
