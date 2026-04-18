import React, { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { orders as ordersApi } from '../../lib/api';
import { ChevronLeft, Package, MessageCircle, Check, XCircle, Loader2 } from 'lucide-react';

const statusColor = { pending: 'bg-gray-500/20 text-gray-400', whatsapp_redirected: 'bg-blue-500/20 text-blue-400', confirmed: 'bg-[#25D366]/20 text-[#25D366]', cancelled: 'bg-red-500/20 text-red-400' };
const statusLabel = { pending: 'En attente', whatsapp_redirected: 'WhatsApp', confirmed: 'Confirme', cancelled: 'Annule' };

export default function VendorOrders() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState('');

  const fetchList = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (filter) params.status = filter;
      const { data } = await ordersApi.me(params);
      setItems(p === 1 ? (data.data || []) : prev => [...prev, ...(data.data || [])]);
      setTotal(data.total || 0);
      setPage(p);
    } catch (e) {
      toast.error('Erreur lors du chargement des commandes');
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchList(1); }, [fetchList]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id + status);
    try {
      await ordersApi.updateStatus(id, { status });
      setItems(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      toast.success(`Commande ${status === 'confirmed' ? 'confirmée' : status === 'cancelled' ? 'annulée' : 'mise à jour'}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Échec de la mise à jour');
    }
    setUpdatingId('');
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="vendor-orders">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vendor/dashboard" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold">Commandes</h1>
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-6">
          {[{ v: '', l: 'Tous' }, { v: 'pending', l: 'En attente' }, { v: 'whatsapp_redirected', l: 'WhatsApp' }, { v: 'confirmed', l: 'Confirme' }, { v: 'cancelled', l: 'Annule' }].map(f => (
            <button key={f.v} data-testid={`vorders-filter-${f.v || 'all'}`} onClick={() => setFilter(f.v)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${filter === f.v ? 'bg-[#25D366] text-white' : 'bg-gray-50 text-gray-400'}`}>{f.l}</button>
          ))}
        </div>

        {loading && items.length === 0 ? <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 animate-shimmer rounded-xl" />)}</div> :
        items.length === 0 ? <div className="text-center py-20"><Package className="w-16 h-16 text-gray-400 mx-auto mb-4" /><p className="text-gray-600">Aucune commande</p></div> :
        <div className="space-y-3">
          <div className="hidden md:grid md:grid-cols-6 gap-3 px-4 text-xs text-gray-500 font-semibold uppercase">
            <span>Commande</span><span>Articles</span><span>Total</span><span>Date</span><span>Statut</span><span>Actions</span>
          </div>
          {items.map(o => {
            const total = o.items?.reduce((s, i) => s + (i.price_at_time || 0) * (i.quantity || 1), 0) || 0;
            const canConfirm = o.status === 'pending' || o.status === 'whatsapp_redirected';
            const canCancel = o.status !== 'cancelled' && o.status !== 'confirmed';
            return (
              <div key={o.id} className="glass p-4 md:grid md:grid-cols-6 md:items-center gap-3" data-testid={`vorder-${o.id}`}>
                <Link to={`/vendor/orders/${o.id}`} className="text-sm font-mono text-[#25D366] hover:underline">#{o.id?.slice(-8)}</Link>
                <span className="text-sm">{o.items?.length || 0} article(s)</span>
                <span className="text-sm font-bold text-[#25D366]">{total.toFixed(2)}$</span>
                <span className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</span>
                <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor[o.status]}`}>{statusLabel[o.status]}</span>
                <div className="flex gap-1 mt-2 md:mt-0">
                  {canConfirm && (
                    <button data-testid={`vorder-confirm-${o.id}`} onClick={() => updateStatus(o.id, 'confirmed')} disabled={updatingId === o.id + 'confirmed'} className="p-1.5 rounded-md bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition disabled:opacity-50" title="Confirmer">
                      {updatingId === o.id + 'confirmed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                  )}
                  {canCancel && (
                    <button data-testid={`vorder-cancel-${o.id}`} onClick={() => updateStatus(o.id, 'cancelled')} disabled={updatingId === o.id + 'cancelled'} className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50" title="Annuler">
                      {updatingId === o.id + 'cancelled' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {items.length < total && <button onClick={() => fetchList(page + 1)} className="btn-secondary w-full">Charger plus</button>}
        </div>}
      </div>
    </div>
  );
}

export function VendorOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState('');

  useEffect(() => { ordersApi.get(id).then(r => { setOrder(r.data.data); setLoading(false); }).catch(() => { toast.error('Commande introuvable'); setLoading(false); }); }, [id]);

  const updateStatus = async (status) => {
    setUpdating(status);
    try {
      await ordersApi.updateStatus(id, { status });
      setOrder(prev => ({ ...prev, status }));
      toast.success(`Commande ${status === 'confirmed' ? 'confirmée' : 'annulée'}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Échec de la mise à jour');
    }
    setUpdating('');
  };

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-3xl mx-auto space-y-4"><div className="h-32 animate-shimmer rounded-xl" /></div></div>;
  if (!order) return <div className="min-h-screen pt-20 flex items-center justify-center text-gray-600">Commande non trouvee</div>;

  const total = order.items?.reduce((s, i) => s + (i.price_at_time || 0) * (i.quantity || 1), 0) || 0;
  const canConfirm = order.status === 'pending' || order.status === 'whatsapp_redirected';
  const canCancel = order.status !== 'cancelled' && order.status !== 'confirmed';

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="vendor-order-detail">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vendor/orders" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <div className="flex-1"><h1 className="text-xl font-bold">Commande #{order.id?.slice(-8)}</h1><p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[order.status]}`}>{statusLabel[order.status]}</span>
        </div>

        <div className="glass p-4 mb-4">
          <h2 className="font-semibold mb-3 text-sm">Articles</h2>
          <div className="space-y-3">{order.items?.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0" />
              <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{item.product_name || 'Produit'}</p><p className="text-xs text-gray-500">x{item.quantity} a {item.price_at_time}$</p></div>
              <span className="text-sm font-bold text-[#25D366]">{(item.price_at_time * item.quantity).toFixed(2)}$</span>
            </div>
          ))}</div>
          <div className="flex justify-between mt-4 pt-3 border-t border-gray-200"><span className="font-semibold">Total</span><span className="font-bold text-[#25D366] text-lg">{total.toFixed(2)}$</span></div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {canConfirm && <button data-testid="vorder-detail-confirm" onClick={() => updateStatus('confirmed')} disabled={!!updating} className="btn-primary flex-1 flex items-center justify-center gap-2">{updating === 'confirmed' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirmer</button>}
          {canCancel && <button data-testid="vorder-detail-cancel" onClick={() => updateStatus('cancelled')} disabled={!!updating} className="btn-danger flex-1 flex items-center justify-center gap-2">{updating === 'cancelled' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Annuler</button>}
          {order.whatsapp_url && <a href={order.whatsapp_url} target="_blank" rel="noreferrer" className="btn-secondary flex-1 flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> WhatsApp</a>}
        </div>
      </div>
    </div>
  );
}
