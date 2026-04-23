import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orders } from '../../lib/api';
import { useLang } from '../../contexts/LangContext';
import { Package, Clock, MessageCircle, ChevronLeft, Star, Loader2 } from 'lucide-react';

const statusColor = { pending: 'bg-gray-500/20 text-gray-400', whatsapp_redirected: 'bg-blue-500/20 text-blue-400', confirmed: 'bg-[#25D366]/20 text-[#25D366]', cancelled: 'bg-red-500/20 text-red-400' };
const statusLabel = { pending: 'En attente', whatsapp_redirected: 'WhatsApp envoye', confirmed: 'Confirme', cancelled: 'Annule' };
const statusSteps = ['pending', 'whatsapp_redirected', 'confirmed'];

export default function ClientOrders() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (filter) params.status = filter;
      const { data } = await orders.me(params);
      setItems(p === 1 ? (data.data || []) : prev => [...prev, ...(data.data || [])]);
      setTotal(data.total || 0);
      setPage(p);
    } catch {}
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(1); }, [filter]);

  const filters = [
    { value: '', label: 'Tous' },
    { value: 'pending', label: 'En attente' },
    { value: 'whatsapp_redirected', label: 'WhatsApp' },
    { value: 'confirmed', label: 'Confirme' },
    { value: 'cancelled', label: 'Annule' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="client-orders">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/client/dashboard" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold">Mes commandes</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
          {filters.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${filter === f.value ? 'bg-[#25D366] text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>{f.label}</button>
          ))}
        </div>

        {loading && items.length === 0 ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-shimmer rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucune commande</p>
            <Link to="/" className="btn-primary mt-4 inline-block">Explorer les boutiques</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(o => (
              <Link key={o.id} to={`/client/orders/${o.id}`} className="glass p-4 block hover:border-[#25D366]/20 transition" data-testid={`order-${o.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-mono">#{o.id?.slice(-8)}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[o.status]}`}>{statusLabel[o.status]}</span>
                </div>
                <p className="text-sm font-medium">{o.items?.length || 0} article(s)</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500"><Clock className="w-3 h-3 inline mr-1" />{new Date(o.created_at).toLocaleDateString()}</span>
                  <span className="text-sm font-bold text-[#25D366]">{o.items?.reduce((s, i) => s + (i.price_at_time || 0) * (i.quantity || 1), 0).toFixed(2)} $</span>
                </div>
              </Link>
            ))}
            {items.length < total && <button onClick={() => fetch(page + 1)} className="btn-secondary w-full">Charger plus</button>}
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    orders.get(id).then(r => { setOrder(r.data.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-3xl mx-auto space-y-4"><div className="h-32 animate-shimmer rounded-xl" /><div className="h-48 animate-shimmer rounded-xl" /></div></div>;
  if (!order) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-600">Commande non trouvee</div>;

  const total = order.items?.reduce((s, i) => s + (i.price_at_time || 0) * (i.quantity || 1), 0) || 0;
  const currentStep = statusSteps.indexOf(order.status);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="order-detail">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/client/orders" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-xl font-bold">Commande #{order.id?.slice(-8)}</h1>
            <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full ${statusColor[order.status]}`}>{statusLabel[order.status]}</span>
        </div>

        {/* Timeline */}
        {order.status !== 'cancelled' && (
          <div className="glass p-4 mb-6">
            <div className="flex items-center justify-between">
              {statusSteps.map((s, i) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${i <= currentStep ? 'bg-[#25D366] text-white' : 'bg-gray-50 text-gray-500'}`}>{i + 1}</div>
                    <span className="text-[10px] text-gray-500 mt-1 text-center">{statusLabel[s]?.split(' ')[0]}</span>
                  </div>
                  {i < statusSteps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${i < currentStep ? 'bg-[#25D366]' : 'bg-gray-50'}`} />}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}
        {order.status === 'cancelled' && <div className="glass p-4 mb-6 border-red-500/20 bg-red-500/5 text-center text-red-400 text-sm font-medium">Commande annulee</div>}

        {/* Items */}
        <div className="glass p-4 mb-6">
          <h2 className="font-semibold mb-3">Articles</h2>
          <div className="space-y-3">
            {order.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product_name || `Produit`}</p>
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-[#25D366]">{(item.price_at_time * item.quantity).toFixed(2)} $</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-3 border-t border-gray-200">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-[#25D366] text-lg">{total.toFixed(2)} $</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {order.whatsapp_url && (
            <a href={order.whatsapp_url} target="_blank" rel="noreferrer" className="btn-primary flex-1 flex items-center justify-center gap-2">
              <MessageCircle className="w-5 h-5" /> Reouvrir WhatsApp
            </a>
          )}
          {order.status !== 'cancelled' && (
            <button onClick={() => setShowReview(true)} className="btn-secondary flex-1 flex items-center justify-center gap-2" data-testid="leave-review-btn">
              <Star className="w-5 h-5" /> Laisser un avis
            </button>
          )}
        </div>

        {/* Review Modal */}
        {showReview && <ReviewModal orderId={order.id} vendorId={order.vendor_id} items={order.items} onClose={() => setShowReview(false)} />}
      </div>
    </div>
  );
}

function ReviewModal({ orderId, vendorId, items, onClose }) {
  const [prodRating, setProdRating] = useState(5);
  const [prodComment, setProdComment] = useState('');
  const [vendRating, setVendRating] = useState(5);
  const [vendComment, setVendComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    setLoading(true);
    const { reviews } = await import('../../lib/api');
    try {
      if (items?.[0]?.product_id) {
        await reviews.create({ order_id: orderId, type: 'product', target_id: items[0].product_id, rating: prodRating, comment: prodComment });
      }
      await reviews.create({ order_id: orderId, type: 'vendor', target_id: vendorId, rating: vendRating, comment: vendComment });
      setDone(true);
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass p-6 w-full max-w-md max-h-[80vh] overflow-y-auto animate-fade-scale">
        {done ? (
          <div className="text-center py-6">
            <Star className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="font-bold mb-1">Merci pour vos avis !</p>
            <p className="text-sm text-gray-500 mb-4">Ils sont en attente de moderation.</p>
            <button onClick={onClose} className="btn-primary">Fermer</button>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-4">Laisser un avis</h2>
            <div className="mb-5">
              <p className="text-sm font-semibold mb-2">Note du produit</p>
              <StarPicker value={prodRating} onChange={setProdRating} />
              <textarea value={prodComment} onChange={e => setProdComment(e.target.value)} placeholder="Votre commentaire..." className="mt-2 !text-sm" rows={3} />
            </div>
            <div className="mb-5">
              <p className="text-sm font-semibold mb-2">Note du vendeur</p>
              <StarPicker value={vendRating} onChange={setVendRating} />
              <textarea value={vendComment} onChange={e => setVendComment(e.target.value)} placeholder="Votre commentaire..." className="mt-2 !text-sm" rows={3} />
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
              <button onClick={submit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Envoyer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={() => onChange(i)} className="transition hover:scale-110">
          <Star className={`w-6 h-6 ${i <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`} />
        </button>
      ))}
    </div>
  );
}
