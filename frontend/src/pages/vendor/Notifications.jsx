import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { notifications } from '../../lib/api';
import { Bell, Check, Trash2, ChevronLeft, Package, Star, AlertTriangle, Megaphone } from 'lucide-react';

const typeIcon = { new_order: <Package className="w-4 h-4" />, order_status_update: <Package className="w-4 h-4" />, review_moderation: <Star className="w-4 h-4" />, subscription_expiry_warning: <AlertTriangle className="w-4 h-4" />, claim_message: <Megaphone className="w-4 h-4" />, claim_assigned: <Megaphone className="w-4 h-4" /> };

export default function VendorNotifications() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await notifications.list({ page: p, limit: 30 });
      setItems(p === 1 ? (data.data || []) : prev => [...prev, ...(data.data || [])]);
      setTotal(data.total || 0);
      setPage(p);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetch(1); }, []);

  const markAll = async () => { try { await notifications.markAllRead(); setItems(prev => prev.map(n => ({ ...n, is_read: true }))); } catch {} };
  const markOne = async (id) => { try { await notifications.markRead(id); setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n)); } catch {} };
  const deleteOne = async (id) => { try { await notifications.delete(id); setItems(prev => prev.filter(n => n.id !== id)); setTotal(prev => prev - 1); } catch {} };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="vendor-notifications">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vendor/dashboard" className="p-2 rounded-lg hover:bg-white/5"><ChevronLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold flex-1">Notifications <span className="text-sm text-gray-500 font-normal">({total})</span></h1>
          {items.some(n => !n.is_read) && <button onClick={markAll} className="text-xs text-[#25D366] hover:underline flex items-center gap-1"><Check className="w-3 h-3" /> Tout marquer lu</button>}
        </div>

        {loading && items.length === 0 ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-shimmer rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20"><Bell className="w-16 h-16 text-gray-700 mx-auto mb-4" /><p className="text-gray-400">Aucune notification</p></div>
        ) : (
          <div className="space-y-2">
            {items.map(n => (
              <div key={n.id} className={`glass p-4 flex items-start gap-3 transition ${!n.is_read ? 'border-l-2 border-l-[#25D366] bg-[#25D366]/[0.03]' : ''}`}>
                <div className={`mt-0.5 flex-shrink-0 ${!n.is_read ? 'text-[#25D366]' : 'text-gray-600'}`}>{typeIcon[n.type] || <Bell className="w-4 h-4" />}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? 'font-medium' : 'text-gray-400'}`}>{n.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {!n.is_read && <button onClick={() => markOne(n.id)} className="p-1.5 rounded-md hover:bg-white/5 text-gray-500"><Check className="w-3.5 h-3.5" /></button>}
                  <button onClick={() => deleteOne(n.id)} className="p-1.5 rounded-md hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
            {items.length < total && <button onClick={() => fetch(page + 1)} className="btn-secondary w-full mt-4">Charger plus</button>}
          </div>
        )}
      </div>
    </div>
  );
}
