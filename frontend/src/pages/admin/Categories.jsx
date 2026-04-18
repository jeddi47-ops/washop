import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categories as catsApi } from '../../lib/api';
import api from '../../lib/api';
import { ChevronLeft, Plus, Trash2, Edit2, Loader2, X } from 'lucide-react';

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetch = async () => { try { const { data } = await catsApi.list({ limit: 100 }); setItems(data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editId) { await api.put(`/v1/categories/${editId}`, { name }); }
      else { await api.post('/v1/categories', { name }); }
      setName(''); setEditId(null); setShowForm(false); fetch();
    } catch {} setSaving(false);
  };

  const del = async (id) => { if (!window.confirm('Supprimer?')) return; try { await api.delete(`/v1/categories/${id}`); setItems(prev => prev.filter(c => c.id !== id)); } catch {} };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="admin-categories">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-xl font-bold text-gray-900 flex-1">Categories</h1>
          <button onClick={() => { setShowForm(true); setEditId(null); setName(''); }} className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Ajouter</button>
        </div>

        {showForm && (
          <form onSubmit={save} className="glass p-4 mb-4 flex items-center gap-3 animate-fade-in">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nom de la categorie" className="flex-1 !text-sm" required />
            <button type="submit" disabled={saving} className="btn-primary !py-2 !px-4 !text-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? 'Modifier' : 'Creer'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-500" /></button>
          </form>
        )}

        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 animate-shimmer rounded-xl" />)}</div> :
        <div className="glass overflow-hidden">
          {items.map((c, i) => (
            <div key={c.id} className={`flex items-center gap-3 p-4 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#25D366] font-bold text-sm">{c.name?.[0]}</div>
              <div className="flex-1"><p className="font-medium text-gray-900">{c.name}</p><p className="text-xs text-gray-500">/{c.slug}</p></div>
              <button onClick={() => { setShowForm(true); setEditId(c.id); setName(c.name); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"><Edit2 className="w-4 h-4" /></button>
              <button onClick={() => del(c.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
