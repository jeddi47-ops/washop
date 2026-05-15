import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { products as productsApi, categories as catsApi, vendors } from '../../lib/api';
import { Plus, X, ChevronLeft, Loader2, Trash2, Image, ToggleLeft, ToggleRight, Search, Star } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '../../components/shared/ProductCard';

export default function VendorProducts() {
  const [items, setItems] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null); // null | 'new' | product obj

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const [p, v] = await Promise.all([productsApi.myProducts({ limit: 100 }), vendors.me()]);
      setItems(p.data.data || []);
      setVendor(v.data.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const toggleActive = async (prod) => {
    try {
      await productsApi.update(prod.id, { is_active: !prod.is_active });
      setItems(prev => prev.map(p => p.id === prod.id ? { ...p, is_active: !p.is_active } : p));
    } catch {}
  };

  const deleteProd = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    try { await productsApi.delete(id); setItems(prev => prev.filter(p => p.id !== id)); } catch {}
  };

  const isBasic = vendor?.subscription_type === 'basic';
  const quota = isBasic ? 15 : Infinity;
  const count = items.length;
  const canAdd = count < quota;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="vendor-products">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vendor/dashboard" className="p-2 rounded-lg hover:bg-gray-50"><ChevronLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold flex-1">Mes produits</h1>
          <button onClick={() => canAdd && setDrawer('new')} disabled={!canAdd} className="btn-primary !py-2 !px-4 !text-sm flex items-center gap-1" data-testid="add-product-btn">
            <Plus className="w-4 h-4" /> Ajouter
          </button>
        </div>

        {/* Quota bar for basic */}
        {isBasic && (
          <div className="glass p-3 mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-600">{count}/{quota} produits</span>
              {count >= quota && <span className="text-xs text-red-400 font-semibold">Limite atteinte — Passez en Premium</span>}
            </div>
            <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${count >= 15 ? 'bg-red-500' : count >= 13 ? 'bg-yellow-500' : 'bg-[#25D366]'}`} style={{ width: `${Math.min(100, (count / quota) * 100)}%` }} />
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 animate-shimmer rounded-xl" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucun produit</p>
            <button onClick={() => setDrawer('new')} className="btn-primary">Ajouter un produit</button>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(p => (
              <div key={p.id} className="glass p-3 flex items-center gap-3" data-testid={`product-row-${p.id}`}>
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                  {p.images?.[0]?.cloudinary_url && <img src={p.images[0].cloudinary_url} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[#25D366] text-sm font-bold">{p.price}$</span>
                    <span className="text-xs text-gray-500">Stock: {p.stock}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => toggleActive(p)} className="p-2 rounded-lg hover:bg-gray-50 transition" title={p.is_active ? 'Desactiver' : 'Activer'}>
                    {p.is_active ? <ToggleRight className="w-5 h-5 text-[#25D366]" /> : <ToggleLeft className="w-5 h-5 text-gray-500" />}
                  </button>
                  <button onClick={() => setDrawer(p)} className="p-2 rounded-lg hover:bg-gray-50 transition text-gray-400 text-xs font-medium">Editer</button>
                  <button onClick={() => deleteProd(p.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Drawer */}
      {drawer && <ProductDrawer product={drawer === 'new' ? null : drawer} onClose={() => setDrawer(null)} onSaved={() => { setDrawer(null); fetch(); }} />}
    </div>
  );
}

function ProductDrawer({ product, onClose, onSaved }) {
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ name: '', category_id: '', description: '', price: '', currency: 'USD', promo_price: '', stock: '', is_active: true, is_featured: false });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => { catsApi.list({ limit: 100 }).then(r => setCats(r.data.data || [])).catch(() => {}); }, []);
  useEffect(() => {
    if (product) setForm({ name: product.name, category_id: product.category_id, description: product.description || '', price: String(product.price), currency: product.currency || 'USD', promo_price: product.promo_price ? String(product.promo_price) : '', stock: String(product.stock), is_active: product.is_active, is_featured: product.is_featured || false });
  }, [product]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (fieldErrors[k]) setFieldErrors(prev => { const { [k]: _, ...rest } = prev; return rest; });
  };

  // Client-side pre-validation: tells the user which specific fields are
  // missing BEFORE we ever hit the API, in plain language.
  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Le nom du produit est obligatoire';
    if (!form.category_id) errs.category_id = 'Choisissez une catégorie';
    const priceNum = parseFloat(form.price);
    if (!form.price || Number.isNaN(priceNum) || priceNum <= 0) errs.price = 'Le prix doit être un nombre supérieur à 0';
    const stockNum = parseInt(form.stock, 10);
    if (form.stock === '' || Number.isNaN(stockNum) || stockNum < 0) errs.stock = 'Le stock doit être un entier positif ou nul';
    if (form.description && form.description.length > 5000) errs.description = 'La description dépasse 5000 caractères';
    return errs;
  };

  // Maps a FastAPI 422 validation-error list into a { field: message } dict.
  const mapApiErrors = (detail) => {
    if (!Array.isArray(detail)) return null;
    const out = {};
    detail.forEach(e => {
      const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : null;
      if (field && typeof e.msg === 'string') out[field] = e.msg;
    });
    return out;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const clientErrs = validate();
    if (Object.keys(clientErrs).length > 0) {
      setFieldErrors(clientErrs);
      const first = Object.values(clientErrs)[0];
      setError(`Certains champs sont invalides : ${first}`);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        category_id: form.category_id,
        description: form.description,
        price: parseFloat(form.price),
        currency: form.currency,
        promo_price: form.promo_price && parseFloat(form.promo_price) > 0 && parseFloat(form.promo_price) < parseFloat(form.price) ? parseFloat(form.promo_price) : null,
        stock: parseInt(form.stock, 10),
        is_active: form.is_active,
        is_featured: form.is_featured,
      };
      let pid;
      if (product) {
        await productsApi.update(product.id, payload);
        pid = product.id;
      } else {
        const { data } = await productsApi.create(payload);
        pid = data.data.id;
      }
      // Upload images
      if (files.length > 0 && pid) {
        const fd = new FormData();
        files.forEach(f => fd.append('files', f));
        await productsApi.uploadImages(pid, fd);
      }
      onSaved();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const mapped = mapApiErrors(detail);
      if (mapped && Object.keys(mapped).length > 0) {
        setFieldErrors(mapped);
        setError('Corrigez les champs indiqués et réessayez.');
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError("Une erreur est survenue lors de l'enregistrement. Réessayez.");
      }
    }
    setLoading(false);
  };

  const fieldClass = (name) => fieldErrors[name]
    ? '!text-sm !border-red-400 focus:!border-red-500 focus:!ring-red-500/40'
    : '!text-sm';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white animate-slide-right flex flex-col">
        <div className="p-4 flex items-center justify-between border-b border-gray-200">
          <h2 className="font-bold">{product ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}

          {/* Images */}
          <div>
            <label className="text-sm text-gray-500 mb-2 block">Images (max 5, 2MB)</label>
            <label className="glass p-6 border-dashed border-[#25D366]/30 flex flex-col items-center cursor-pointer hover:border-[#25D366]/60 transition">
              <Image className="w-8 h-8 text-[#25D366] mb-2" />
              <span className="text-xs text-gray-600">Glissez ou cliquez</span>
              <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={e => setFiles(Array.from(e.target.files).slice(0, 5))} />
            </label>
            {files.length > 0 && <p className="text-xs text-[#25D366] mt-1">{files.length} fichier(s) selectionne(s)</p>}
          </div>

          <div>
            <label className="text-sm text-gray-500 mb-1 block">Nom <span className="text-gray-500">({form.name.length}/300)</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} maxLength={300} className={fieldClass('name')} data-testid="product-name" />
            {fieldErrors.name && <p className="text-xs text-red-500 mt-1" data-testid="product-name-error">{fieldErrors.name}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Categorie</label>
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className={fieldClass('category_id')} data-testid="product-category">
              <option value="">Choisir...</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {fieldErrors.category_id && <p className="text-xs text-red-500 mt-1" data-testid="product-category-error">{fieldErrors.category_id}</p>}
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Description <span className="text-gray-500">({form.description.length}/5000)</span></label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} maxLength={5000} className={fieldClass('description')} data-testid="product-description" />
            {fieldErrors.description && <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Prix ($)</label>
              <input type="number" step="0.01" min="0.01" value={form.price} onChange={e => set('price', e.target.value)} className={fieldClass('price')} data-testid="product-price" />
              {fieldErrors.price && <p className="text-xs text-red-500 mt-1" data-testid="product-price-error">{fieldErrors.price}</p>}
            </div>
            <div>
              <label className="text-sm text-gray-500 mb-1 block">Stock</label>
              <input type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} className={fieldClass('stock')} data-testid="product-stock" />
              {fieldErrors.stock && <p className="text-xs text-red-500 mt-1" data-testid="product-stock-error">{fieldErrors.stock}</p>}
            </div>
          </div>

          {/* Devise */}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Devise</label>
            <select value={form.currency} onChange={e => set('currency', e.target.value)}
              className="w-full border border-gray-200 rounded-xl bg-gray-50 text-sm px-3 py-2.5 outline-none focus:border-[#25D366] transition"
              data-testid="product-currency">
              {Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => (
                <option key={code} value={code}>{code} — {sym}</option>
              ))}
            </select>
          </div>

          {/* Prix promotionnel */}
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Prix promotionnel <span className="text-gray-400 text-xs">(optionnel — doit être inférieur au prix normal)</span></label>
            <input
              type="number" step="0.01" min="0.01"
              value={form.promo_price}
              onChange={e => set('promo_price', e.target.value)}
              placeholder="Ex: 8.00"
              className="w-full border border-gray-200 rounded-xl bg-gray-50 text-sm px-3 py-2.5 outline-none focus:border-[#25D366] transition"
              data-testid="product-promo-price"
            />
            {form.promo_price && parseFloat(form.promo_price) >= parseFloat(form.price) && (
              <p className="text-xs text-red-500 mt-1">Le prix promo doit être inférieur au prix normal</p>
            )}
          </div>

          {/* Produit populaire — Premium uniquement */}
          <div className={`flex items-center justify-between p-3 rounded-xl border transition ${!isBasic ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
            <div>
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400" />
                Produit populaire
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {!isBasic
                  ? 'Apparaît dans l\'onglet "Populaires" de votre boutique'
                  : '🔒 Fonctionnalité réservée au plan Premium'}
              </p>
            </div>
            <button
              type="button"
              disabled={isBasic}
              onClick={() => !isBasic && set('is_featured', !form.is_featured)}
              data-testid="product-featured-toggle"
            >
              {form.is_featured
                ? <ToggleRight className="w-8 h-8 text-[#25D366]" />
                : <ToggleLeft className="w-8 h-8 text-gray-300" />}
            </button>
          </div>

        </form>
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 !text-sm">Annuler</button>
          <button onClick={submit} disabled={loading} className="btn-primary flex-1 !text-sm flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
