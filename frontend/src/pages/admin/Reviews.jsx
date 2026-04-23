import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reviews } from '../../lib/api';
import { ChevronLeft, Star, Check, X, Trash2, Loader2 } from 'lucide-react';

const statusBadge = { pending: 'bg-yellow-50 text-yellow-600', approved: 'bg-green-50 text-green-600', rejected: 'bg-red-50 text-red-500' };

export default function AdminReviews() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    const params = { limit: 50 };
    if (filter) params.status = filter;
    try { const { data } = await reviews.list(params); setItems(data.data || []); setTotal(data.total || 0); } catch {}
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const moderate = async (id, status) => {
    setActing(id);
    try { await reviews.moderate(id, { status }); setItems(prev => prev.map(r => r.id === id ? { ...r, status } : r)); } catch {}
    setActing('');
  };

  const del = async (id) => {
    if (!window.confirm('Supprimer cet avis definitivement?')) return;
    setActing(id);
    try {
      const api = (await import('../../lib/api')).default;
      await api.delete(`/v1/reviews/${id}`);
      setItems(prev => prev.filter(r => r.id !== id));
      setTotal(t => t - 1);
    } catch {}
    setActing('');
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="admin-reviews">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-xl font-bold text-gray-900">Moderation avis ({total})</h1>
        </div>
        <div className="flex gap-2 mb-4">
          {['pending', 'approved', 'rejected', ''].map(s => (
            <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === s ? 'bg-[#25D366] text-white' : 'bg-gray-100 text-gray-600'}`}>{s === 'pending' ? 'En attente' : s === 'approved' ? 'Approuves' : s === 'rejected' ? 'Rejetes' : 'Tous'}</button>
          ))}
        </div>

        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-24 animate-shimmer rounded-xl" />)}</div> :
        items.length === 0 ? <div className="text-center py-20 text-gray-400"><Star className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>Aucun avis</p></div> :
        <div className="space-y-2">
          {items.map(r => (
            <div key={r.id} className="glass p-4" data-testid={`review-${r.id}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}</div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.type === 'product' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{r.type === 'product' ? 'Produit' : 'Vendeur'}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge[r.status]}`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-1">{r.comment || <em className="text-gray-400">Pas de commentaire</em>}</p>
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => moderate(r.id, 'approved')} disabled={acting === r.id} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition" title="Approuver"><Check className="w-4 h-4" /></button>
                      <button onClick={() => moderate(r.id, 'rejected')} disabled={acting === r.id} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition" title="Rejeter"><X className="w-4 h-4" /></button>
                    </>
                  )}
                  <button onClick={() => del(r.id)} disabled={acting === r.id} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
