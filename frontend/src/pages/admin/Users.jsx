import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { users } from '../../lib/api';
import { ChevronLeft, Search, UserCheck, UserX, Ban, Loader2 } from 'lucide-react';

const roleBadge = { client: 'bg-blue-50 text-blue-600', vendor: 'bg-green-50 text-[#25D366]', admin: 'bg-purple-50 text-purple-600', employee: 'bg-orange-50 text-orange-600' };
const statusBadge = { active: 'bg-green-50 text-green-600', suspended: 'bg-yellow-50 text-yellow-600', banned: 'bg-red-50 text-red-600' };

export default function AdminUsers() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState('');

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (roleFilter) params.role = roleFilter;
    if (statusFilter) params.status = statusFilter;
    try {
      const { data } = await users.list(params);
      setItems(p === 1 ? (data.data || []) : prev => [...prev, ...(data.data || [])]);
      setTotal(data.total || 0);
      setPage(p);
    } catch {} setLoading(false);
  }, [roleFilter, statusFilter]);

  useEffect(() => { fetch(1); }, [fetch]);

  const changeStatus = async (id, status) => {
    setUpdating(id);
    try { await users.updateStatus(id, { status }); setItems(prev => prev.map(u => u.id === id ? { ...u, status } : u)); } catch {}
    setUpdating('');
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try { await users.delete(id); setItems(prev => prev.filter(u => u.id !== id)); setTotal(t => t - 1); } catch {}
  };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="admin-users">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-xl font-bold text-gray-900">Utilisateurs ({total})</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {['', 'client', 'vendor', 'admin', 'employee'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${roleFilter === r ? 'bg-[#25D366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{r || 'Tous'}</button>
          ))}
          <span className="w-px h-6 bg-gray-200 self-center mx-1" />
          {['', 'active', 'suspended', 'banned'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${statusFilter === s ? 'bg-[#25D366] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s || 'Tous statuts'}</button>
          ))}
        </div>

        {loading && items.length === 0 ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 animate-shimmer rounded-xl" />)}</div> :
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="text-left py-3 px-4">Utilisateur</th><th className="text-left py-3 px-4">Role</th><th className="text-left py-3 px-4">Statut</th><th className="text-left py-3 px-4">Date</th><th className="text-right py-3 px-4">Actions</th>
              </tr></thead>
              <tbody>
                {items.map(u => (
                  <tr key={u.id} className="border-t border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-white text-xs font-bold">{u.name?.[0]?.toUpperCase()}</div>
                        <div><p className="font-medium text-gray-900">{u.name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                      </div>
                    </td>
                    <td className="py-3 px-4"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${roleBadge[u.role] || ''}`}>{u.role}</span></td>
                    <td className="py-3 px-4"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge[u.status] || ''}`}>{u.status}</span></td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {u.status !== 'active' && <button onClick={() => changeStatus(u.id, 'active')} disabled={updating === u.id} className="p-1.5 rounded-md hover:bg-green-50 text-green-500 transition" title="Activer"><UserCheck className="w-4 h-4" /></button>}
                        {u.status === 'active' && <button onClick={() => changeStatus(u.id, 'suspended')} disabled={updating === u.id} className="p-1.5 rounded-md hover:bg-yellow-50 text-yellow-500 transition" title="Suspendre"><UserX className="w-4 h-4" /></button>}
                        {u.status !== 'banned' && u.role !== 'admin' && <button onClick={() => changeStatus(u.id, 'banned')} disabled={updating === u.id} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition" title="Bannir"><Ban className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {items.length < total && <div className="p-3 text-center border-t border-gray-100"><button onClick={() => fetch(page + 1)} className="text-sm text-[#25D366] hover:underline font-medium">Charger plus</button></div>}
        </div>}
      </div>
    </div>
  );
}
