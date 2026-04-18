import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../../lib/api';
import { Users, Store, Package, ShoppingBag, MessageSquare, Star, Zap, Key, BarChart3, Clock, ChevronRight, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { admin.dashboard().then(r => { setData(r.data.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div className="min-h-screen pt-20 px-4"><div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">{Array(8).fill(0).map((_, i) => <div key={i} className="h-24 animate-shimmer rounded-xl" />)}</div></div>;

  const stats = [
    { icon: <Users className="w-5 h-5" />, label: 'Utilisateurs', value: data?.total_users || 0, color: 'text-blue-500', bg: 'bg-blue-50', to: '/admin/users' },
    { icon: <Store className="w-5 h-5" />, label: 'Vendeurs', value: data?.total_vendors || 0, sub: `${data?.active_vendors || 0} actifs`, color: 'text-[#25D366]', bg: 'bg-green-50', to: '/admin/vendors' },
    { icon: <Package className="w-5 h-5" />, label: 'Produits', value: data?.total_products || 0, color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: <ShoppingBag className="w-5 h-5" />, label: 'Commandes', value: data?.total_orders || 0, color: 'text-orange-500', bg: 'bg-orange-50' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Reclamations', value: data?.open_claims || 0, color: 'text-red-500', bg: 'bg-red-50', to: '/admin/claims' },
    { icon: <Star className="w-5 h-5" />, label: 'Avis en attente', value: data?.pending_reviews || 0, color: 'text-yellow-500', bg: 'bg-yellow-50', to: '/admin/reviews' },
    { icon: <Key className="w-5 h-5" />, label: 'Cles utilisees', value: `${data?.used_keys || 0}/${data?.total_keys || 0}`, color: 'text-teal-500', bg: 'bg-teal-50', to: '/admin/keys' },
    { icon: <Zap className="w-5 h-5" />, label: 'Ventes flash', value: data?.active_flash_sales || 0, color: 'text-pink-500', bg: 'bg-pink-50', to: '/admin/flash-sales' },
  ];

  const sub = data?.subscription_breakdown || {};

  const shortcuts = [
    { icon: <Users className="w-5 h-5" />, label: 'Utilisateurs', to: '/admin/users' },
    { icon: <Store className="w-5 h-5" />, label: 'Vendeurs', to: '/admin/vendors' },
    { icon: <Key className="w-5 h-5" />, label: 'Cles d\'acces', to: '/admin/keys' },
    { icon: <Package className="w-5 h-5" />, label: 'Categories', to: '/admin/categories' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Reclamations', to: '/admin/claims' },
    { icon: <Star className="w-5 h-5" />, label: 'Moderation avis', to: '/admin/reviews' },
    { icon: <Zap className="w-5 h-5" />, label: 'Ventes flash', to: '/admin/flash-sales' },
    { icon: <FileText className="w-5 h-5" />, label: 'Logs admin', to: '/admin/logs' },
    { icon: <BarChart3 className="w-5 h-5" />, label: 'Recherches manquees', to: '/admin/search-misses' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="admin-dashboard">
      <div className="max-w-6xl mx-auto">
        <div className="glass p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Administration Washop</h1>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de la plateforme</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map(s => {
            const Inner = () => (
              <div className="glass p-4 hover:shadow-md transition">
                <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center mb-2`}>{s.icon}</div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
                {s.sub && <p className="text-xs text-[#25D366] mt-0.5">{s.sub}</p>}
              </div>
            );
            return s.to ? <Link key={s.label} to={s.to}><Inner /></Link> : <div key={s.label}><Inner /></div>;
          })}
        </div>

        {/* Subscription breakdown */}
        <div className="glass p-5 mb-6">
          <h2 className="font-bold mb-4 text-gray-900">Repartition abonnements actifs</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'Basic', count: sub.basic || 0, color: 'bg-gray-200' },
              { name: 'Premium', count: sub.premium || 0, color: 'bg-blue-400' },
              { name: 'Extra', count: sub.extra || 0, color: 'bg-[#25D366]' },
            ].map(p => {
              const total = (sub.basic || 0) + (sub.premium || 0) + (sub.extra || 0);
              const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <div key={p.name} className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{p.count}</p>
                  <p className="text-xs text-gray-500 mb-2">{p.name}</p>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${p.color} rounded-full`} style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {shortcuts.map(s => (
            <Link key={s.to} to={s.to} className="glass p-4 flex items-center gap-3 hover:border-[#25D366] hover:shadow-md transition">
              <div className="text-[#25D366]">{s.icon}</div>
              <span className="text-sm font-medium text-gray-700">{s.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
