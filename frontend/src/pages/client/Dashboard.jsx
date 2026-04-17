import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { orders, wishlist, notifications } from '../../lib/api';
import { ShoppingBag, Heart, Bell, User, MessageSquare, ChevronRight, Package, Clock } from 'lucide-react';

const statusColor = { pending: 'bg-gray-500/20 text-gray-400', whatsapp_redirected: 'bg-blue-500/20 text-blue-400', confirmed: 'bg-[#25D366]/20 text-[#25D366]', cancelled: 'bg-red-500/20 text-red-400' };
const statusLabel = { pending: 'En attente', whatsapp_redirected: 'WhatsApp', confirmed: 'Confirme', cancelled: 'Annule' };

export default function ClientDashboard() {
  const { user } = useAuth();
  const { t } = useLang();
  const [stats, setStats] = useState({ orders: 0, wishlistCount: 0, unread: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      orders.me({ limit: 5 }).catch(() => ({ data: { data: [], total: 0 } })),
      wishlist.list({ limit: 1 }).catch(() => ({ data: { total: 0 } })),
      notifications.unreadCount().catch(() => ({ data: { data: { count: 0 } } })),
    ]).then(([o, w, n]) => {
      setRecentOrders(o.data.data || []);
      setStats({ orders: o.data.total || 0, wishlistCount: w.data.total || 0, unread: n.data.data?.count || 0 });
      setLoading(false);
    });
  }, []);

  const cards = [
    { icon: <Package className="w-6 h-6" />, label: 'Commandes', value: stats.orders, to: '/client/orders', color: 'text-blue-400' },
    { icon: <Heart className="w-6 h-6" />, label: 'Wishlist', value: stats.wishlistCount, to: '/client/wishlist', color: 'text-red-400' },
    { icon: <Bell className="w-6 h-6" />, label: 'Notifications', value: stats.unread, to: '/client/notifications', color: 'text-yellow-400' },
  ];

  const shortcuts = [
    { icon: <Package className="w-5 h-5" />, label: 'Mes commandes', to: '/client/orders' },
    { icon: <Heart className="w-5 h-5" />, label: 'Wishlist', to: '/client/wishlist' },
    { icon: <Bell className="w-5 h-5" />, label: 'Notifications', to: '/client/notifications' },
    { icon: <MessageSquare className="w-5 h-5" />, label: 'Reclamations', to: '/client/claims' },
    { icon: <User className="w-5 h-5" />, label: 'Mon profil', to: '/client/profile' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 animate-fade-in" data-testid="client-dashboard">
      <div className="max-w-5xl mx-auto">
        {/* Welcome */}
        <div className="glass p-6 mb-6">
          <h1 className="text-2xl font-bold">Bonjour {user?.name} <span className="inline-block animate-float">&#128075;</span></h1>
          <p className="text-sm text-gray-400 mt-1">Bienvenue sur votre tableau de bord</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {cards.map(c => (
            <Link key={c.to} to={c.to} className="glass p-4 text-center hover:border-[#25D366]/30 transition">
              <div className={`${c.color} mx-auto mb-2`}>{c.icon}</div>
              <p className="text-2xl font-bold">{loading ? '-' : c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </Link>
          ))}
        </div>

        {/* Recent orders */}
        <div className="glass p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Dernieres commandes</h2>
            <Link to="/client/orders" className="text-xs text-[#25D366] hover:underline flex items-center gap-1">Tout voir <ChevronRight className="w-3 h-3" /></Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 animate-shimmer rounded-lg" />)}</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune commande</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map(o => (
                <Link key={o.id} to={`/client/orders/${o.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition">
                  <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{o.items?.length || 0} article(s)</p>
                    <p className="text-xs text-gray-600">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[o.status] || ''}`}>{statusLabel[o.status] || o.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {shortcuts.map(s => (
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
