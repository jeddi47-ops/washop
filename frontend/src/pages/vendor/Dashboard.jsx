import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { vendors, orders as ordersApi, products as productsApi } from '../../lib/api';
import { Package, Eye, TrendingUp, Star, ChevronRight, Clock, AlertTriangle, Key, Plus, BarChart3, ShoppingBag, Settings, Bell } from 'lucide-react';

const statusColor = { pending: 'bg-gray-500/20 text-gray-400', whatsapp_redirected: 'bg-blue-500/20 text-blue-400', confirmed: 'bg-[#25D366]/20 text-[#25D366]', cancelled: 'bg-red-500/20 text-red-400' };
const statusLabel = { pending: 'En attente', whatsapp_redirected: 'WhatsApp', confirmed: 'Confirme', cancelled: 'Annule' };
const planColor = { basic: 'bg-gray-500/20 text-gray-400', premium: 'bg-blue-500/20 text-blue-400', extra: 'bg-[#25D366]/20 text-[#25D366]' };

export default function VendorDashboard() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const v = await vendors.me();
        setVendor(v.data.data);
        const vid = v.data.data.id;
        const [s, o, p] = await Promise.all([
          vendors.stats(vid).catch(() => ({ data: { data: {} } })),
          ordersApi.me({ limit: 5 }).catch(() => ({ data: { data: [] } })),
          productsApi.myProducts({ limit: 3, sort_by: 'click_count', sort_order: 'desc' }).catch(() => ({ data: { data: [] } })),
        ]);
        setStats(s.data.data);
        setRecentOrders(o.data.data || []);
        setTopProducts(p.data.data || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-5xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 animate-shimmer rounded-xl" />)}</div></div>;

  const isExpired = vendor && !vendor.is_active;
  const isTrial = vendor && vendor.trial_expires_at && !vendor.subscription_expires_at;
  const trialDays = isTrial ? Math.max(0, Math.ceil((new Date(vendor.trial_expires_at) - new Date()) / 86400000)) : 0;
  const subDays = vendor?.subscription_expires_at ? Math.max(0, Math.ceil((new Date(vendor.subscription_expires_at) - new Date()) / 86400000)) : 0;

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="vendor-dashboard">
      <div className="max-w-5xl mx-auto">
        {/* Subscription banner */}
        {isExpired && (
          <div className="glass p-4 mb-4 border-red-500/30 bg-red-500/5 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1"><p className="text-sm font-semibold text-red-400">Abonnement expire — Votre boutique est invisible</p></div>
            <Link to="/vendor/subscription" className="btn-primary !py-2 !px-4 !text-xs">Reactiver</Link>
          </div>
        )}
        {isTrial && trialDays > 0 && (
          <div className="glass p-4 mb-4 border-yellow-500/30 bg-yellow-500/5 flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-yellow-400 flex-1">Essai gratuit — J-{trialDays} jours restants</p>
            <Link to="/vendor/subscription" className="btn-secondary !py-2 !px-4 !text-xs !border-yellow-500 !text-yellow-400">Voir les plans</Link>
          </div>
        )}
        {!isExpired && !isTrial && vendor?.subscription_type && (
          <div className="glass p-4 mb-4 flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${planColor[vendor.subscription_type]}`}>{vendor.subscription_type}</span>
            <p className="text-sm text-gray-400 flex-1">Expire dans {subDays} jours</p>
            <Link to="/vendor/subscription" className="text-xs text-[#25D366] hover:underline">Gerer &rarr;</Link>
          </div>
        )}

        {/* Welcome */}
        <div className="glass p-6 mb-6">
          <h1 className="text-2xl font-bold">{vendor?.shop_name || user?.name}</h1>
          <p className="text-sm text-gray-400 mt-1">Tableau de bord vendeur</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: <Eye className="w-5 h-5" />, label: 'Clics', value: stats?.total_clicks || 0, color: 'text-blue-400' },
            { icon: <Package className="w-5 h-5" />, label: 'Commandes', value: stats?.total_orders || 0, color: 'text-[#25D366]' },
            { icon: <TrendingUp className="w-5 h-5" />, label: 'Conversion', value: `${stats?.conversion_rate || 0}%`, color: 'text-purple-400' },
            { icon: <Star className="w-5 h-5" />, label: 'Note', value: stats?.avg_product_rating?.toFixed(1) || '—', color: 'text-yellow-400' },
          ].map(c => (
            <div key={c.label} className="glass p-4 text-center">
              <div className={`${c.color} mx-auto mb-2`}>{c.icon}</div>
              <p className="text-xl font-bold">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent orders */}
          <div className="glass p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm">Dernieres commandes</h2>
              <Link to="/vendor/orders" className="text-xs text-[#25D366] hover:underline flex items-center gap-1">Tout voir <ChevronRight className="w-3 h-3" /></Link>
            </div>
            {recentOrders.length === 0 ? <p className="text-gray-500 text-sm text-center py-6">Aucune commande</p> :
              <div className="space-y-2">{recentOrders.map(o => (
                <Link key={o.id} to={`/vendor/orders/${o.id}`} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex-1 min-w-0"><p className="text-sm truncate">{o.items?.length || 0} article(s)</p><p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</p></div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor[o.status]}`}>{statusLabel[o.status]}</span>
                </Link>
              ))}</div>}
          </div>

          {/* Top products */}
          <div className="glass p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm">Top produits</h2>
              <Link to="/vendor/products" className="text-xs text-[#25D366] hover:underline flex items-center gap-1">Tous <ChevronRight className="w-3 h-3" /></Link>
            </div>
            {topProducts.length === 0 ? <p className="text-gray-500 text-sm text-center py-6">Aucun produit</p> :
              <div className="space-y-2">{topProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">{p.images?.[0]?.cloudinary_url && <img src={p.images[0].cloudinary_url} alt="" className="w-full h-full object-cover" />}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.name}</p><p className="text-xs text-gray-500">{p.click_count} clics</p></div>
                  <span className="text-sm font-bold text-[#25D366]">{p.price}$</span>
                </div>
              ))}</div>}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
          {[
            { icon: <Plus className="w-5 h-5" />, label: 'Ajouter produit', to: '/vendor/products' },
            { icon: <Package className="w-5 h-5" />, label: 'Commandes', to: '/vendor/orders' },
            { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', to: '/vendor/analytics' },
            { icon: <Key className="w-5 h-5" />, label: 'Abonnement', to: '/vendor/subscription' },
            { icon: <Settings className="w-5 h-5" />, label: 'Ma boutique', to: '/vendor/profile' },
            { icon: <Bell className="w-5 h-5" />, label: 'Notifications', to: '/vendor/notifications' },
          ].map(s => (
            <Link key={s.to} to={s.to} className="glass p-4 flex items-center gap-3 hover:border-[#25D366]/30 transition">
              <div className="text-[#25D366]">{s.icon}</div>
              <span className="text-sm font-medium">{s.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
