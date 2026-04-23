import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { flashSalesAdmin, products as productsApi, search as searchApi } from '../../lib/api';
import { ChevronLeft, Zap, Plus, Trash2, Loader2, Pause, Search } from 'lucide-react';

export default function AdminFlashSales() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product_id: '', discount_percentage: 20, starts_at: '', ends_at: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searching, setSearching] = useState(false);

  const fetch = async () => { try { const { data } = await flashSalesAdmin.list({ active_only: false, limit: 50 }); setItems(data.data || []); } catch {} setLoading(false); };
  useEffect(() => { fetch(); }, []);

  // Debounced product search
  useEffect(() => {
    if (!showForm) return;
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        if (productQuery && productQuery.trim().length >= 1) {
          const { data } = await searchApi.query({ q: productQuery.trim(), limit: 10 });
          setProductResults(data.data || []);
        } else {
          const { data } = await productsApi.list({ limit: 10 });
          setProductResults(data.data || []);
        }
      } catch {}
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [productQuery, showForm]);

  const pickProduct = (p) => {
    setSelectedProduct(p);
    setForm(f => ({ ...f, product_id: p.id }));
    setProductQuery(p.name);
    setProductResults([]);
  };

  const create = async (e) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await flashSalesAdmin.create({ ...form, discount_percentage: parseInt(form.discount_percentage), starts_at: new Date(form.starts_at).toISOString(), ends_at: new Date(form.ends_at).toISOString() });
      setShowForm(false);
      setForm({ product_id: '', discount_percentage: 20, starts_at: '', ends_at: '' });
      setSelectedProduct(null); setProductQuery(''); setProductResults([]);
      fetch();
    } catch (err) { setError(err.response?.data?.detail || 'Erreur'); }
    setSaving(false);
  };

  const deactivate = async (id) => { try { await flashSalesAdmin.deactivate(id); setItems(prev => prev.map(s => s.id === id ? { ...s, is_active: false } : s)); } catch {} };
  const del = async (id) => { if (!window.confirm('Supprimer?')) return; try { await flashSalesAdmin.delete(id); setItems(prev => prev.filter(s => s.id !== id)); } catch {} };

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="admin-flash-sales">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin/dashboard" className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft className="w-5 h-5 text-gray-600" /></Link>
          <h1 className="text-xl font-bold text-gray-900 flex-1 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Ventes Flash</h1>
          <button data-testid="admin-flash-create-btn" onClick={() => setShowForm(true)} className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-1"><Plus className="w-4 h-4" /> Creer</button>
        </div>

        {showForm && (
          <form onSubmit={create} className="glass p-5 mb-6 space-y-3 animate-fade-in">
            {error && <div className="p-3 rounded-lg bg-red-50 text-red-500 text-sm">{error}</div>}
            <div className="relative">
              <label className="text-xs text-gray-500 mb-1 block">Produit</label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  data-testid="admin-flash-product-search"
                  value={productQuery}
                  onChange={e => { setProductQuery(e.target.value); setSelectedProduct(null); setForm(f => ({ ...f, product_id: '' })); }}
                  placeholder="Rechercher un produit par nom..."
                  className="!text-sm !pl-9"
                  required={!form.product_id}
                  autoComplete="off"
                />
              </div>
              {selectedProduct && (
                <p className="mt-1 text-xs text-gray-500">ID : <code className="font-mono text-[#25D366]">{selectedProduct.id}</code> · Prix actuel : <strong>{selectedProduct.price}$</strong></p>
              )}
              {!selectedProduct && productResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {productResults.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      data-testid={`admin-flash-product-option-${p.id}`}
                      onClick={() => pickProduct(p)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.price}$ · <span className="font-mono">{p.id}</span></p>
                    </button>
                  ))}
                </div>
              )}
              {!selectedProduct && !searching && productQuery && productResults.length === 0 && (
                <p className="mt-1 text-xs text-gray-400">Aucun produit trouvé</p>
              )}
            </div>
            <div><label className="text-xs text-gray-500 mb-1 block">Reduction (%)</label><input type="number" min="1" max="100" value={form.discount_percentage} onChange={e => setForm(f => ({ ...f, discount_percentage: e.target.value }))} required className="!text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-gray-500 mb-1 block">Debut</label><input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} required className="!text-sm" /></div>
              <div><label className="text-xs text-gray-500 mb-1 block">Fin</label><input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} required className="!text-sm" /></div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowForm(false); setSelectedProduct(null); setProductQuery(''); }} className="btn-secondary flex-1 !text-sm">Annuler</button>
              <button type="submit" disabled={saving || !form.product_id} className="btn-primary flex-1 !text-sm flex items-center justify-center gap-2 disabled:opacity-50">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Creer</button>
            </div>
          </form>
        )}

        {loading ? <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 animate-shimmer rounded-xl" />)}</div> :
        items.length === 0 ? <div className="text-center py-20 text-gray-400"><Zap className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>Aucune vente flash</p></div> :
        <div className="space-y-2">
          {items.map(s => (
            <div key={s.id} className="glass p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{s.product?.name || s.product_id}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="text-red-500 font-bold">-{s.discount_percentage}%</span>
                  <span>{s.discounted_price?.toFixed(2)}$ <span className="line-through text-gray-400">{s.product?.price}$</span></span>
                  <span>{new Date(s.starts_at).toLocaleDateString()} → {new Date(s.ends_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{s.is_active ? 'Active' : 'Inactive'}</span>
                {s.is_active && <button onClick={() => deactivate(s.id)} className="p-1.5 rounded-md hover:bg-yellow-50 text-yellow-500"><Pause className="w-4 h-4" /></button>}
                <button onClick={() => del(s.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>}
      </div>
    </div>
  );
}
