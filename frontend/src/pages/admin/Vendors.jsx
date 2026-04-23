import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { vendors as vendorsApi } from '../../lib/api';
import { ChevronLeft, ShieldCheck, Trash2, Pause, Play, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const subBadge = { basic: 'bg-gray-100 text-gray-600', premium: 'bg-blue-50 text-blue-600', extra: 'bg-green-50 text-[#25D366]' };

export default function AdminVendors() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    const params = { page: p, limit: 20, active_only: false };
    if (filter) params.subscription_type = filter;
    try {
      const { data } = await vendorsApi.list(params);
      setItems(p === 1 ? (data.data || []) : prev => [...prev, ...(data.data || [])]);
      setTotal(data.total || 0); setPage(p);
    } catch {} setLoading(false);
  }, [filter]);

  useEffect(() => { fetch(1); }, [fetch]);

  const verify = async (id) => { try { await api.put(`/v1/vendors/${id}/verify`); setItems(prev => prev.map(v => v.id === id ? { ...v, is_verified: true } : v)); } catch {} };
  const togglePause = async (id) => { try { await api.put(`/v1/vendors/${id}/pause`); setItems(prev => prev.map(v => v.id === id ? { ...v, is_paused: !v.is_paused } : v)); } catch {} };
  const hardDelete = async (id) => { if (!window.confirm('ATTENTION: Suppression definitive du vendeur et toutes ses donnees ?')) return; try { await api.delete(`/v1/vendors/${id}/hard`); setItems(prev => prev.filter(v => v.id !== id)); setTotal(t => t - 1); } catch {} };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="admin-vendors">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-xl font-bold text-gray-900">Vendeurs ({total})</h1>
        </div>

        <div className="flex gap-2 mb-4">
          {['', 'basic', 'premium', 'extra'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === f ? 'bg-[#25D366] text-white' : 'bg-gray-100 text-gray-600'}`}>{f || 'Tous'}</button>
          ))}
        </div>

        {loading && items.length === 0 ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 animate-shimmer rounded-xl" />)}</div> :
        <div className="space-y-2">
          {items.map(v => (
            <div key={v.id} className="glass p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366] font-bold flex-shrink-0">{v.shop_name?.[0]}</div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 flex items-center gap-1.5 truncate">{v.shop_name} {v.is_verified && <ShieldCheck className="w-4 h-4 text-[#25D366]" />}</p>
                  <p className="text-xs text-gray-500">/{v.shop_slug} {v.whatsapp_number && `• ${v.whatsapp_number}`}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${subBadge[v.subscription_type] || 'bg-gray-100 text-gray-500'}`}>{v.subscription_type || '—'}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${v.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>{v.is_active ? 'Actif' : 'Inactif'}</span>
                {v.is_paused && <span className="text-xs px-2 py-1 rounded-full bg-yellow-50 text-yellow-600">En pause</span>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {!v.is_verified && <button onClick={() => verify(v.id)} className="p-1.5 rounded-md hover:bg-green-50 text-green-500 transition" title="Verifier"><ShieldCheck className="w-4 h-4" /></button>}
                <button onClick={() => togglePause(v.id)} className="p-1.5 rounded-md hover:bg-yellow-50 text-yellow-500 transition" title={v.is_paused ? 'Reprendre' : 'Pause'}>{v.is_paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}</button>
                <button onClick={() => hardDelete(v.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition" title="Supprimer"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {items.length < total && <button onClick={() => fetch(page + 1)} className="btn-secondary w-full !text-sm">Charger plus</button>}
        </div>}
      </div>
    </div>
  );
}
