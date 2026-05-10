import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Search, ShoppingBag, Bell, Menu, X, Globe, ChevronDown, User,
  LayoutDashboard, LogOut, Home, Sparkles, Store, Info, HelpCircle,
  Heart, Package, MessageSquare, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useLang } from '../../contexts/LangContext';
import { search as searchApi, notifications } from '../../lib/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count, setOpen: setCartOpen } = useCart();
  const { t, lang, toggleLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [unread, setUnread] = useState(0);
  const searchRef = useRef(null);
  const userRef = useRef(null);
  const closeBtnRef = useRef(null);

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

  // Mobile menu accessibility: ESC key closes, body scroll is locked while
  // the drawer is open, and focus is moved to the close button on open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileOpen]);

  // Auto-close the mobile menu whenever the route changes.
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleSearch = (e) => { e.preventDefault(); if (query.trim()) { navigate(`/search?q=${encodeURIComponent(query.trim())}`); setShowSuggestions(false); setMobileOpen(false); } };
  const dashboardPath = user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'vendor' ? '/vendor/dashboard' : user?.role === 'employee' ? '/employee/claims' : '/client/dashboard';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        <Link to="/" className="flex-shrink-0 flex items-center gap-2" data-testid="nav-logo">
          <img src="/logo.png" alt="Washop" className="h-9 w-9 rounded-lg object-cover" />
          <span className="hidden sm:block text-lg font-bold text-gray-900">Wa<span className="text-[#25D366]">shop</span></span>
        </Link>

        <form onSubmit={handleSearch} ref={searchRef} className="hidden md:flex flex-1 max-w-md mx-4 relative" data-testid="search-form">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.nav.search} className="!pl-10 !py-2 !text-sm !bg-gray-50 !border-gray-200 !rounded-full w-full !text-gray-900" data-testid="search-input" />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
              {suggestions.map((s, i) => <button key={i} onClick={() => { setQuery(s); navigate(`/search?q=${encodeURIComponent(s)}`); setShowSuggestions(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">{s}</button>)}
            </div>
          )}
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {/* Comment ça marche — desktop only */}
          <Link
            to="/about"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-[#25D366] hover:bg-gray-50 transition"
            data-testid="nav-about"
          >
            <HelpCircle className="w-4 h-4" />
            Comment ça marche
          </Link>
          <button onClick={toggleLang} className="p-2 rounded-lg hover:bg-gray-100 transition text-xs font-semibold flex items-center gap-1 text-gray-600" data-testid="lang-toggle">
            <Globe className="w-4 h-4" /> {lang.toUpperCase()}
          </button>

          {user && (
            <button onClick={() => navigate(user.role === 'client' ? '/client/notifications' : '/vendor/notifications')} className="relative p-2 rounded-lg hover:bg-gray-100 transition" data-testid="notif-bell">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#25D366] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
            </button>
          )}

          <button onClick={() => setCartOpen(true)} className="relative p-2 rounded-lg hover:bg-gray-100 transition" data-testid="cart-btn">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && <span className="absolute -top-0.5 -right-0.5 bg-[#25D366] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{count}</span>}
          </button>

          {user ? (
            <div ref={userRef} className="relative">
              <button onClick={() => setUserMenu(!userMenu)} className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-gray-100 transition" data-testid="user-menu-btn">
                <div className="w-8 h-8 rounded-full bg-[#25D366] flex items-center justify-center text-sm font-bold text-white">{user.name?.[0]?.toUpperCase()}</div>
                <ChevronDown className="w-3.5 h-3.5 hidden sm:block text-gray-500" />
              </button>
              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg animate-fade-in" data-testid="user-dropdown">
                  <div className="px-4 py-3 border-b border-gray-200"><p className="text-sm font-semibold truncate">{user.name}</p><p className="text-xs text-gray-500">{user.role}</p></div>
                  <Link to={dashboardPath} onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-100 transition"><LayoutDashboard className="w-4 h-4" />{t.nav.dashboard}</Link>
                  <Link to={`/${user.role}/profile`} onClick={() => setUserMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-100 transition"><User className="w-4 h-4" />{t.nav.profile}</Link>
                  <button onClick={() => { logout(); setUserMenu(false); navigate('/'); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gray-100 transition" data-testid="logout-btn"><LogOut className="w-4 h-4" />{t.nav.logout}</button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="btn-secondary !py-2 !px-4 !text-sm" data-testid="login-btn">{t.nav.login}</Link>
              <Link to="/register" className="btn-primary !py-2 !px-4 !text-sm" data-testid="register-btn">{t.nav.register}</Link>
            </div>
          )}

          <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-gray-100" data-testid="mobile-menu-btn"><Menu className="w-5 h-5" /></button>
        </div>
      </div>

      {/* Mobile menu */}
      {/* ============ MOBILE MENU ============ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-menu-title"
          data-testid="mobile-menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer */}
          <aside
            className="absolute left-0 top-0 bottom-0 w-[88%] max-w-sm shadow-2xl flex flex-col animate-slide-left"
            style={{ backgroundColor: '#ffffff', backdropFilter: 'none' }}
          >
            {/* HEADER */}
            <div
              className="flex items-center justify-between px-4 h-16 border-b border-gray-200 flex-shrink-0"
              style={{ backgroundColor: '#ffffff' }}
            >
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2"
                id="mobile-menu-title"
              >
                <img src="/logo.png" alt="" className="h-8 w-8 rounded-lg object-cover" />
                <span className="font-bold text-gray-900 text-lg">Wa<span className="text-[#25D366]">shop</span></span>
              </Link>
              <button
                ref={closeBtnRef}
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer le menu"
                className="p-2 -mr-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                data-testid="mobile-menu-close"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* SCROLLABLE BODY */}
            <div className="flex-1 overflow-y-auto" style={{ backgroundColor: '#ffffff' }}>
              {/* User identity card */}
              {user && (
                <div className="px-4 pt-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/5 border border-[#25D366]/20">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-lg font-bold text-white shadow-md">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Search */}
              <form onSubmit={handleSearch} className="p-4">
                <label className="sr-only" htmlFor="mobile-search">{t.nav.search}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                  <input
                    id="mobile-search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder={t.nav.search}
                    className="!pl-10 !py-2.5 !text-sm !rounded-full w-full !bg-gray-50 !border-gray-200 !text-gray-900"
                    data-testid="mobile-search-input"
                  />
                </div>
              </form>

              {/* Découvrir */}
              <NavSection title="Découvrir">
                <NavItem to="/" icon={Home} label="Accueil" pathname={location.pathname} onClick={() => setMobileOpen(false)} testid="mobile-nav-home" />
                <NavItem to="/#catalog" icon={Sparkles} label="Catalogue" onClick={() => setMobileOpen(false)} testid="mobile-nav-catalog" />
                <NavItem to="/about" icon={HelpCircle} label="Comment ça marche" pathname={location.pathname} onClick={() => setMobileOpen(false)} testid="mobile-nav-about" />
              </NavSection>

              {/* Mon compte */}
              {user && (
                <NavSection title="Mon compte">
                  <NavItem to={dashboardPath} icon={LayoutDashboard} label={t.nav.dashboard} pathname={location.pathname} onClick={() => setMobileOpen(false)} testid="mobile-nav-dashboard" />
                  <NavItem to={`/${user.role}/profile`} icon={User} label={t.nav.profile} pathname={location.pathname} onClick={() => setMobileOpen(false)} testid="mobile-nav-profile" />
                  {user.role === 'client' && (
                    <>
                      <NavItem to="/client/orders" icon={Package} label="Mes commandes" pathname={location.pathname} onClick={() => setMobileOpen(false)} />
                      <NavItem to="/client/wishlist" icon={Heart} label="Ma wishlist" pathname={location.pathname} onClick={() => setMobileOpen(false)} />
                      <NavItem to="/client/claims" icon={MessageSquare} label="Réclamations" pathname={location.pathname} onClick={() => setMobileOpen(false)} />
                      <NavItem to="/client/notifications" icon={Bell} label="Notifications" badge={unread} pathname={location.pathname} onClick={() => setMobileOpen(false)} />
                    </>
                  )}
                  {user.role === 'vendor' && (
                    <>
                      <NavItem to="/vendor/products" icon={Package} label="Mes produits" pathname={location.pathname} onClick={() => setMobileOpen(false)} />
                      <NavItem to="/vendor/orders" icon={ShoppingBag} label="Mes commandes" pathname={location.pathname} onClick={() => setMobileOpen(false)} />
                      <NavItem to="/vendor/notifications" icon={Bell} label="Notifications" badge={unread} pathname={location.pathname} onClick={() => setMobileOpen(false)} />
                    </>
                  )}
                </NavSection>
              )}

              {/* Outils */}
              <NavSection title="Outils">
                <button
                  type="button"
                  onClick={() => { setCartOpen(true); setMobileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  data-testid="mobile-nav-cart"
                >
                  <ShoppingBag className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1 text-sm text-gray-800">{t.nav.cart}</span>
                  {count > 0 && (
                    <span className="bg-[#25D366] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">{count}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={toggleLang}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  data-testid="mobile-nav-lang"
                  aria-label={`Langue actuelle : ${lang.toUpperCase()}, changer`}
                >
                  <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1 text-sm text-gray-800">Langue</span>
                  <span className="text-xs font-bold text-gray-500 uppercase">{lang}</span>
                  <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
                </button>
              </NavSection>

              {/* Devenir vendeur (only for guests + clients) */}
              {(!user || user.role === 'client') && (
                <NavSection title="Pour les vendeurs">
                  <NavItem
                    to="/register"
                    icon={Store}
                    label={user ? "Ouvrir une boutique" : t.hero.become_vendor}
                    onClick={() => setMobileOpen(false)}
                    accent
                    testid="mobile-nav-become-vendor"
                  />
                  <NavItem
                    to="/about"
                    icon={HelpCircle}
                    label={t.how.title}
                    onClick={() => setMobileOpen(false)}
                  />
                </NavSection>
              )}
            </div>

            {/* FOOTER actions (sticky bottom) */}
            <div
              className="border-t border-gray-200 px-4 py-4 flex-shrink-0"
              style={{ backgroundColor: '#ffffff' }}
            >
              {user ? (
                <button
                  onClick={() => { logout(); setMobileOpen(false); navigate('/'); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-colors"
                  data-testid="mobile-logout-btn"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  {t.nav.logout}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-secondary text-center !text-sm !py-2.5"
                    data-testid="mobile-login-btn"
                  >
                    {t.nav.login}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary text-center !text-sm !py-2.5"
                    data-testid="mobile-register-btn"
                  >
                    {t.nav.register}
                  </Link>
                </div>
              )}
              <p className="mt-3 text-[11px] text-center text-gray-400">
                Wa<span className="text-[#25D366] font-semibold">shop</span> · {t.footer.tagline}
              </p>
            </div>
          </aside>
        </div>
      )}
    </nav>
  );
}

/**
 * Section header used inside the mobile drawer.
 */
function NavSection({ title, children }) {
  return (
    <div className="mt-2">
      <h3 className="px-4 pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {title}
      </h3>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

/**
 * Single mobile-menu item. Uses `aria-current="page"` for accessibility
 * when the link matches the current pathname, and supports an optional
 * notification badge (number) and an `accent` flag for CTAs.
 */
function NavItem({ to, icon: Icon, label, badge, onClick, pathname, accent, testid }) {
  const isCurrent = pathname && pathname === to;
  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        aria-current={isCurrent ? 'page' : undefined}
        data-testid={testid}
        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
          accent
            ? 'text-[#25D366] hover:bg-[#25D366]/5 font-semibold'
            : isCurrent
              ? 'bg-[#25D366]/10 text-[#25D366] font-semibold'
              : 'text-gray-800 hover:bg-gray-50'
        }`}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${accent || isCurrent ? 'text-[#25D366]' : 'text-gray-500'}`} aria-hidden="true" />
        <span className="flex-1 text-sm">{label}</span>
        {badge > 0 && (
          <span className="bg-[#25D366] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-gray-300" aria-hidden="true" />
      </Link>
    </li>
  );
}
