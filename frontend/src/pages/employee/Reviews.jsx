import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { reviews } from '../../lib/api';
import { ChevronLeft, Star, Check, X } from 'lucide-react';

export default function EmployeeReviews() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    try { const { data } = await reviews.list({ status: 'pending', limit: 50 }); setItems(data.data || []); setTotal(data.total || 0); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const moderate = async (id, status) => {
    setActing(id);
    try { await reviews.moderate(id, { status }); setItems(prev => prev.filter(r => r.id !== id)); setTotal(t => t - 1); } catch {}
    setActing('');
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="employee-reviews">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/employee/claims" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Star className="w-5 h-5 text-yellow-500" /> Moderation avis ({total} en attente)</h1>
        </div>

        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-24 animate-shimmer rounded-xl" />)}</div> :
        items.length === 0 ? (
          <div className="text-center py-20">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Aucun avis en attente</p>
            <Link to="/employee/claims" className="text-sm text-[#25D366] hover:underline">Retour aux reclamations</Link>
          </div>
        ) :
        <div className="space-y-2">
          {items.map(r => (
            <div key={r.id} className="glass p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />)}</div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.type === 'product' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{r.type === 'product' ? 'Produit' : 'Vendeur'}</span>
                </div>
                <p className="text-sm text-gray-700">{r.comment || <em className="text-gray-400">Pas de commentaire</em>}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => moderate(r.id, 'approved')} disabled={acting === r.id} className="p-2.5 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 transition" title="Approuver">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={() => moderate(r.id, 'rejected')} disabled={acting === r.id} className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition" title="Rejeter">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
