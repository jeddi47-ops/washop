import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../../lib/api';
import { ChevronLeft, FileText, Search } from 'lucide-react';

export default function AdminLogs() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    try { const { data } = await admin.logs({ page: p, limit: 30 }); setItems(p === 1 ? (data.data || []) : prev => [...prev, ...(data.data || [])]); setTotal(data.total || 0); setPage(p); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(1); }, [fetch]);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="admin-logs">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><FileText className="w-5 h-5 text-[#25D366]" /> Logs admin ({total})</h1>
        </div>

        {loading && items.length === 0 ? <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 animate-shimmer rounded-xl" />)}</div> :
        items.length === 0 ? <div className="text-center py-20 text-gray-400"><FileText className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>Aucun log</p></div> :
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase"><th className="text-left py-3 px-4">Action</th><th className="text-left py-3 px-4">Type</th><th className="text-left py-3 px-4">Description</th><th className="text-left py-3 px-4">Date</th></tr></thead>
              <tbody>{items.map(l => (
                <tr key={l.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4"><span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-600">{l.action_type}</span></td>
                  <td className="py-3 px-4 text-gray-600">{l.target_type}</td>
                  <td className="py-3 px-4 text-gray-700 text-xs max-w-[300px] truncate">{l.description}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{l.created_at ? new Date(l.created_at).toLocaleString('fr-FR') : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {items.length < total && <div className="p-3 text-center border-t border-gray-100"><button onClick={() => fetch(page + 1)} className="text-sm text-[#25D366] hover:underline font-medium">Charger plus</button></div>}
        </div>}
      </div>
    </div>
  );
}

export function AdminSearchMisses() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { admin.searchMisses({ limit: 50 }).then(r => { setItems(r.data.data || []); setTotal(r.data.total || 0); setLoading(false); }).catch(() => setLoading(false)); }, []);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="admin-search-misses">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Search className="w-5 h-5 text-[#25D366]" /> Recherches manquees ({total})</h1>
        </div>

        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-shimmer rounded-xl" />)}</div> :
        items.length === 0 ? <div className="text-center py-20 text-gray-400"><Search className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>Aucune recherche manquee</p></div> :
        <div className="glass overflow-hidden">
          {items.map((m, i) => {
            const maxCount = items[0]?.count || 1;
            return (
              <div key={i} className={`flex items-center gap-4 p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
                <span className="text-sm font-bold text-gray-400 w-8">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{m.query}</p>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                    <div className="h-full bg-[#25D366] rounded-full transition-all" style={{ width: `${(m.count / maxCount) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-[#25D366]">{m.count}</span>
              </div>
            );
          })}
        </div>}
      </div>
    </div>
  );
}
