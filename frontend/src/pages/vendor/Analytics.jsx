import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { vendors } from '../../lib/api';
import { ChevronLeft, BarChart3, Eye, Package, TrendingUp, Star } from 'lucide-react';

export default function VendorAnalytics() {
  const [vendor, setVendor] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const v = await vendors.me();
        setVendor(v.data.data);
        const s = await vendors.stats(v.data.data.id);
        setStats(s.data.data);
        const { products: productsApi } = await import('../../lib/api');
        const p = await productsApi.myProducts({ limit: 20, sort_by: 'click_count', sort_order: 'desc' });
        setProducts(p.data.data || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-4xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 animate-shimmer rounded-xl" />)}</div></div>;

  const maxClicks = Math.max(...products.map(p => p.click_count || 0), 1);

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="vendor-analytics">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/vendor/dashboard" className="p-2 rounded-lg hover:bg-white/5"><ChevronLeft className="w-5 h-5" /></Link>
          <h1 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#25D366]" /> Analytics</h1>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { icon: <Eye className="w-5 h-5" />, label: 'Clics totaux', value: stats?.total_clicks || 0, color: 'text-blue-400' },
            { icon: <Package className="w-5 h-5" />, label: 'Commandes', value: stats?.total_orders || 0, color: 'text-[#25D366]' },
            { icon: <TrendingUp className="w-5 h-5" />, label: 'Conversion', value: `${stats?.conversion_rate || 0}%`, color: 'text-purple-400' },
            { icon: <Star className="w-5 h-5" />, label: 'Note moyenne', value: stats?.avg_product_rating?.toFixed(1) || '—', color: 'text-yellow-400' },
          ].map(c => (
            <div key={c.label} className="glass p-5 text-center">
              <div className={`${c.color} mx-auto mb-2`}>{c.icon}</div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-gray-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Clicks per product bar chart */}
        <div className="glass p-5 mb-6">
          <h2 className="font-bold mb-4">Clics par produit</h2>
          {products.length === 0 ? <p className="text-gray-500 text-sm text-center py-6">Aucun produit</p> :
          <div className="space-y-3">
            {products.map(p => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-24 truncate flex-shrink-0">{p.name}</span>
                <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${Math.max(5, (p.click_count / maxClicks) * 100)}%` }}>
                    <span className="text-[10px] font-bold">{p.click_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>}
        </div>

        {/* Top products table */}
        <div className="glass p-5">
          <h2 className="font-bold mb-4">Top produits</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-500 uppercase border-b border-white/5">
                <th className="text-left py-2 px-2">#</th><th className="text-left py-2 px-2">Produit</th><th className="text-right py-2 px-2">Clics</th><th className="text-right py-2 px-2">Prix</th><th className="text-right py-2 px-2">Stock</th>
              </tr></thead>
              <tbody>
                {products.slice(0, 10).map((p, i) => (
                  <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                    <td className="py-2.5 px-2 text-gray-500">{i + 1}</td>
                    <td className="py-2.5 px-2 font-medium truncate max-w-[200px]">{p.name}</td>
                    <td className="py-2.5 px-2 text-right text-[#25D366] font-semibold">{p.click_count}</td>
                    <td className="py-2.5 px-2 text-right">{p.price}$</td>
                    <td className="py-2.5 px-2 text-right">{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
