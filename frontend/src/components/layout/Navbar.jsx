import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Bell, Menu, X, Globe, ChevronDown, User, LayoutDashboard, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../contexts/LangContext';
import { search as searchApi, notifications } from '../../lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count, setOpen: setCartOpen } = useCart();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [unread, setUnread] = useState(0);
  const searchRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try { const { data } = await notifications.unreadCount(); setUnread(data.data.count); } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) { setSuggestions([]); return; }
      try { const { data } = await searchApi.suggestions(query); setSuggestions(data.data || []); setShowSuggestions(true); } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false); if (userRef.current && !userRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => { e.preventDefault(); if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setShowSuggestions(false); setMobileOpen(false); } };
  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'vendor' ? '/vendor/dashboard' : user?.role === 'employee' ? '/employee/claims' : '/client/dashboard';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        <Link to="/" className="flex-shrink-0 flex items-center gap-2" data-testid="nav-logo">
          <img src="/logo.png" alt="Washop" className="h-9 w-9 rounded-lg object-cover" />
          <span className="hidden sm:block text-lg font-bold">Wa<span className="text-[#25D366]">shop</span></span>
        </Link>

        <form onSubmit={handleSearch} ref={searchRef} className="hidden md:flex flex-1 max-w-md mx-4 relative" data-testid="search-form">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.nav.search} className="!pl-10 !py-2 !text-sm !bg-[#1A1A1A] !rounded-full w-full" data-testid="search-input" />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
              {suggestions.map((s, i) => <button key={i} onClick={() => { setQuery(s); navigate(`/search?q=${encodeURIComponent(s)}`); setShowSuggestions(false); }} className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition">{s}</button>)}
            </div>
          )}
        </form>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={toggleLang} className="p-2 rounded-lg hover:bg-white/5 transition text-xs font-semibold flex items-center gap-1" data-testid="lang-toggle">
            <Globe className="w-4 h-4" /> {lang.toUpperCase()}
          </button>

          {user && (
            <button onClick={() => navigate(user.role === 'client' ? '/client/notifications' : '/vendor/notifications')} className="relative p-2 rounded-lg hover:bg-white/5 transition" data-testid="notif-bell">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#25D366] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
            </button>
          )}

          <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-lg hover:bg-white/5 transition" data-testid="cart-btn">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#25D366] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{count}</span>}
          </button>

          {user ? (
            <div ref={userRef} className="relative">
              <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/5 transition" data-testid="user-menu-btn">
                <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-sm font-bold">{user.name?.[0]?.toUpperCase()}</div>
                <ChevronDown className="w-3.5 h-3.5 hidden sm:block" />
              </button>
              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-fade-in" data-testid="user-dropdown">
                  <div className="px-4 py-3 border-b border-white/5"><p className="text-sm font-semibold truncate">{user.name}</p><p className="text-xs text-gray-500">{user.role}</p></div>
                  <Link to={dashboardPath} onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition"><LayoutDashboard className="w-4 h-4" />{t.nav.dashboard}</Link>
                  <Link to={`/${user.role}/profile`} onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 transition"><User className="w-4 h-4" />{t.nav.profile}</Link>
                  <button onClick={() => { logout(); setUserMenu(false); navigate('/'); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition" data-testid="logout-btn"><LogOut className="w-4 h-4" />{t.nav.logout}</button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="btn-secondary !py-2 !px-4 !text-sm" data-testid="login-btn">{t.nav.login}</Link>
              <Link to="/register" className="btn-primary !py-2 !px-4 !text-sm" data-testid="register-btn">{t.nav.register}</Link>
            </div>
          )}

          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-white/5" data-testid="mobile-menu-btn"><Menu className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#111] animate-slide-left">
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                <img src="/logo.png" alt="Washop" className="h-8 w-8 rounded-lg object-cover" />
                <span className="font-bold">Wa<span className="text-[#25D366]">shop</span></span>
              </Link>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSearch} className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.nav.search} className="!pl-10 !py-2.5 !text-sm !rounded-full w-full" />
              </div>
            </form>
            <div className="px-4 flex flex-col gap-1">
              {user ? (
                <>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center font-bold">{user.name?.[0]?.toUpperCase()}</div>
                    <div><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-gray-500">{user.role}</p></div>
                  </div>
                  <Link to={dashboardPath} onClick={() => setMobileOpen(false)} className="py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm transition">{t.nav.dashboard}</Link>
                  <Link to={`/${user.role}/profile`} onClick={() => setMobileOpen(false)} className="py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm transition">{t.nav.profile}</Link>
                  <button onClick={() => { logout(); setMobileOpen(false); navigate('/'); }} className="py-2.5 px-3 rounded-lg hover:bg-white/5 text-sm text-red-400 text-left transition">{t.nav.logout}</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary text-center !text-sm mb-2">{t.nav.login}</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-center !text-sm">{t.nav.register}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
