import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { accessKeys } from '../../lib/api';
import { ChevronLeft, Key, Plus, Ban, Copy, Loader2, X, Check } from 'lucide-react';

const typeBadge = { basic: 'bg-gray-100 text-gray-600', premium: 'bg-blue-50 text-blue-600', extra: 'bg-green-50 text-[#25D366]' };

export default function AdminKeys() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeF, setTypeF] = useState('');
  const [statusF, setStatusF] = useState('');
  const [showGen, setShowGen] = useState(false);
  const [genForm, setGenForm] = useState({ type: 'basic', duration: 'monthly', quantity: 5 });
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [copied, setCopied] = useState('');

  const fetch = useCallback(async (p = 1) => {
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (typeF) params.type = typeF;
    if (statusF) params.status = statusF;
    try {
      const { data } = await accessKeys.list(params);
      setItems(p === 1 ? (data.data || []) : prev => [...prev, ...(data.data || [])]);
      setTotal(data.total || 0); setPage(p);
    } catch {} setLoading(false);
  }, [typeF, statusF]);

  useEffect(() => { fetch(1); }, [fetch]);

  const generate = async (e) => {
    e.preventDefault(); setGenerating(true);
    try {
      const { data } = await accessKeys.generate(genForm);
      setGenResult(data.data); fetch(1);
    } catch {} setGenerating(false);
  };

  const blacklist = async (id) => {
    if (!window.confirm('Blacklister cette cle?')) return;
    try { await accessKeys.blacklist(id); setItems(prev => prev.map(k => k.id === id ? { ...k, is_blacklisted: true } : k)); } catch {}
  };

  const copyKey = (code) => { navigator.clipboard?.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 2000); };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="admin-keys">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-xl font-bold text-gray-900 flex-1">Cles d'acces ({total})</h1>
          <button onClick={() => { setShowGen(true); setGenResult(null); }} className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Generer</button>
        </div>

        {/* Generate modal */}
        {showGen && (
          <div className="glass p-5 mb-6 animate-fade-in">
            {genResult ? (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">{genResult.count} cles generees (batch: {genResult.batch_id})</h3>
                  <button onClick={() => setShowGen(false)}><X className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1">
                  {genResult.keys?.map(k => (
                    <div key={k.id} className="flex items-center gap-2 text-sm font-mono">
                      <span className="text-gray-800">{k.key_code}</span>
                      <button onClick={() => copyKey(k.key_code)} className="p-1 rounded hover:bg-gray-200 transition">{copied === k.key_code ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={generate}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900">Generer des cles</h3>
                  <button type="button" onClick={() => setShowGen(false)}><X className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div><label className="text-xs text-gray-500 mb-1 block">Type</label><select value={genForm.type} onChange={e => setGenForm(f => ({ ...f, type: e.target.value }))} className="!text-sm"><option value="basic">Basic</option><option value="premium">Premium</option><option value="extra">Extra</option></select></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Duree</label><select value={genForm.duration} onChange={e => setGenForm(f => ({ ...f, duration: e.target.value }))} className="!text-sm"><option value="monthly">Mensuel</option><option value="annual">Annuel</option></select></div>
                  <div><label className="text-xs text-gray-500 mb-1 block">Quantite</label><input type="number" min="1" max="100" value={genForm.quantity} onChange={e => setGenForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} className="!text-sm" /></div>
                </div>
                <button type="submit" disabled={generating} className="btn-primary !text-sm w-full flex items-center justify-center gap-2">{generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />} Generer</button>
              </form>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {['', 'basic', 'premium', 'extra'].map(t => (
            <button key={t} onClick={() => setTypeF(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${typeF === t ? 'bg-[#25D366] text-white' : 'bg-gray-100 text-gray-600'}`}>{t || 'Tous types'}</button>
          ))}
          <span className="w-px h-6 bg-gray-200 self-center mx-1" />
          {['', 'available', 'used', 'blacklisted'].map(s => (
            <button key={s} onClick={() => setStatusF(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${statusF === s ? 'bg-[#25D366] text-white' : 'bg-gray-100 text-gray-600'}`}>{s === 'available' ? 'Disponibles' : s === 'used' ? 'Utilisees' : s === 'blacklisted' ? 'Blacklist' : 'Tous statuts'}</button>
          ))}
        </div>

        {loading && items.length === 0 ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-shimmer rounded-xl" />)}</div> :
        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                <th className="text-left py-3 px-4">Cle</th><th className="text-left py-3 px-4">Type</th><th className="text-left py-3 px-4">Duree</th><th className="text-left py-3 px-4">Statut</th><th className="text-left py-3 px-4">Utilise par</th><th className="text-right py-3 px-4">Action</th>
              </tr></thead>
              <tbody>
                {items.map(k => (
                  <tr key={k.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono text-xs text-gray-800 flex items-center gap-1">
                      {k.key_code}
                      <button onClick={() => copyKey(k.key_code)} className="p-0.5 rounded hover:bg-gray-200">{copied === k.key_code ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}</button>
                    </td>
                    <td className="py-3 px-4"><span className={`text-xs font-semibold px-2 py-1 rounded-full ${typeBadge[k.type] || ''}`}>{k.type}</span></td>
                    <td className="py-3 px-4 text-gray-600">{k.duration === 'annual' ? 'Annuel' : 'Mensuel'}</td>
                    <td className="py-3 px-4">
                      {k.is_blacklisted ? <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-500 font-semibold">Blacklist</span> :
                       k.is_used ? <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-500 font-semibold">Utilisee</span> :
                       <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600 font-semibold">Disponible</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{k.used_by || '—'}</td>
                    <td className="py-3 px-4 text-right">{!k.is_used && !k.is_blacklisted && <button onClick={() => blacklist(k.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400 transition" title="Blacklister"><Ban className="w-4 h-4" /></button>}</td>
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
