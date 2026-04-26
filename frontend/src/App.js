import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LangProvider } from './contexts/LangContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/shared/CartDrawer';
import AccountStatusScreen from './components/layout/AccountStatusScreen';
import SubscriptionExpiredScreen from './components/layout/SubscriptionExpiredScreen';
import EmailVerificationWall from './components/layout/EmailVerificationWall';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import ShopPage from './pages/ShopPage';
import SearchPage from './pages/SearchPage';
import About from './pages/About';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifyEmailSent from './pages/auth/VerifyEmailSent';
import ProtectedRoute from './components/layout/ProtectedRoute';
import ClientDashboard from './pages/client/Dashboard';
import ClientOrders, { ClientOrderDetail } from './pages/client/Orders';
import ClientWishlist from './pages/client/Wishlist';
import ClientNotifications from './pages/client/Notifications';
import ClientClaims, { ClientClaimDetail } from './pages/client/Claims';
import ClientProfile from './pages/client/Profile';
import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts from './pages/vendor/Products';
import VendorOrders, { VendorOrderDetail } from './pages/vendor/Orders';
import VendorAnalytics from './pages/vendor/Analytics';
import VendorSubscription from './pages/vendor/Subscription';
import VendorProfile from './pages/vendor/Profile';
import VendorOnboarding from './pages/vendor/Onboarding';
import VendorNotifications from './pages/vendor/Notifications';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminVendors from './pages/admin/Vendors';
import AdminCategories from './pages/admin/Categories';
import AdminKeys from './pages/admin/Keys';
import AdminClaims, { AdminClaimDetail } from './pages/admin/Claims';
import AdminReviews from './pages/admin/Reviews';
import AdminFlashSales from './pages/admin/FlashSales';
import AdminLogs, { AdminSearchMisses } from './pages/admin/Logs';
import EmployeeClaims, { EmployeeClaimDetail } from './pages/employee/Claims';
import EmployeeReviews from './pages/employee/Reviews';
import { Toaster } from 'sonner';
import { vendors } from './lib/api';
import './App.css';

function SplashScreen({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
      <div className="text-center animate-fade-scale">
        <img src="/logo.png" alt="Washop" className="h-24 w-24 rounded-2xl mx-auto mb-4 object-cover" />
        <p className="text-xl font-bold">Wa<span className="text-[#25D366]">shop</span></p>
        <div className="mt-6 w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-[#25D366] rounded-full animate-progress" />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [splash, setSplash] = useState(true);

  return (
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <CartProvider>
            {splash && <SplashScreen onDone={() => setSplash(false)} />}
            <AppShell splash={splash} />
          </CartProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}

function AppShell({ splash }) {
  const { user } = useAuth();
  const location = useLocation();
  const [subExpired, setSubExpired]   = useState(false);
  const [isTrial,    setIsTrial]      = useState(false);

  // ── Check subscription status whenever user changes ──────────────────────
  const checkSubscription = useCallback(async () => {
    if (!user || user.role !== 'vendor') { setSubExpired(false); return; }
    try {
      const { data } = await vendors.me();
      const v = data.data;
      const now = new Date();
      const trialExp = v.trial_expires_at ? new Date(v.trial_expires_at) : null;
      const subExp   = v.subscription_expires_at ? new Date(v.subscription_expires_at) : null;
      const trialOk  = trialExp && now < trialExp;
      const subOk    = subExp   && now < subExp;
      setIsTrial(!subExp);           // no paid subscription ever used → it was a trial
      setSubExpired(!trialOk && !subOk);
    } catch {
      // Network error: don't block the user, fail silently
    }
  }, [user]);

  useEffect(() => { checkSubscription(); }, [checkSubscription]);

  // ── Listen for real-time 403 fired by the API interceptor ────────────────
  useEffect(() => {
    const handler = () => { setSubExpired(true); };
    window.addEventListener('washop:sub-expired', handler);
    return () => window.removeEventListener('washop:sub-expired', handler);
  }, []);

  // Subscription / trial expired → show dedicated screen instead of the app
  if (user && user.role === 'vendor' && subExpired) {
    return <SubscriptionExpiredScreen isTrial={isTrial} onRefresh={checkSubscription} />;
  }

  // If the logged-in user is banned or suspended, we deliberately keep the
  // session alive (per product requirement) but replace the entire UI with
  // a dedicated status screen. No navbar, no routes, no footer.
  if (user && (user.status === 'banned' || user.status === 'suspended')) {
    return <AccountStatusScreen status={user.status} />;
  }

  // Unverified email → full-screen wall prevents any access to the shop.
  // The /verify-email route itself is whitelisted so that clicking the link
  // in the email inbox actually works and can flip email_verified to true.
  if (user && user.email_verified === false && location.pathname !== '/verify-email') {
    return <EmailVerificationWall />;
  }

  return (
    <div className={`min-h-screen bg-white ${splash ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}`}>
      <Navbar />
      <CartDrawer />
      <main className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/boutiques/:slug" element={<ShopPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
          {/* Client Dashboard */}
          <Route path="/client/dashboard" element={<ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/client/orders" element={<ProtectedRoute roles={['client']}><ClientOrders /></ProtectedRoute>} />
          <Route path="/client/orders/:id" element={<ProtectedRoute roles={['client']}><ClientOrderDetail /></ProtectedRoute>} />
          <Route path="/client/wishlist" element={<ProtectedRoute roles={['client']}><ClientWishlist /></ProtectedRoute>} />
          <Route path="/client/notifications" element={<ProtectedRoute roles={['client']}><ClientNotifications /></ProtectedRoute>} />
          <Route path="/client/claims" element={<ProtectedRoute roles={['client']}><ClientClaims /></ProtectedRoute>} />
          <Route path="/client/claims/:id" element={<ProtectedRoute roles={['client']}><ClientClaimDetail /></ProtectedRoute>} />
          <Route path="/client/profile" element={<ProtectedRoute roles={['client']}><ClientProfile /></ProtectedRoute>} />
          {/* Vendor Dashboard */}
          <Route path="/vendor/dashboard" element={<ProtectedRoute roles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
          <Route path="/vendor/products" element={<ProtectedRoute roles={['vendor']}><VendorProducts /></ProtectedRoute>} />
          <Route path="/vendor/orders" element={<ProtectedRoute roles={['vendor']}><VendorOrders /></ProtectedRoute>} />
          <Route path="/vendor/orders/:id" element={<ProtectedRoute roles={['vendor']}><VendorOrderDetail /></ProtectedRoute>} />
          <Route path="/vendor/analytics" element={<ProtectedRoute roles={['vendor']}><VendorAnalytics /></ProtectedRoute>} />
          <Route path="/vendor/subscription" element={<ProtectedRoute roles={['vendor']}><VendorSubscription /></ProtectedRoute>} />
          <Route path="/vendor/profile" element={<ProtectedRoute roles={['vendor']}><VendorProfile /></ProtectedRoute>} />
          <Route path="/vendor/onboarding" element={<ProtectedRoute roles={['vendor']}><VendorOnboarding /></ProtectedRoute>} />
          <Route path="/vendor/notifications" element={<ProtectedRoute roles={['vendor']}><VendorNotifications /></ProtectedRoute>} />
          {/* Admin Dashboard */}
          <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/vendors" element={<ProtectedRoute roles={['admin']}><AdminVendors /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute roles={['admin']}><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/keys" element={<ProtectedRoute roles={['admin']}><AdminKeys /></ProtectedRoute>} />
          <Route path="/admin/claims" element={<ProtectedRoute roles={['admin']}><AdminClaims /></ProtectedRoute>} />
          <Route path="/admin/claims/:id" element={<ProtectedRoute roles={['admin']}><AdminClaimDetail /></ProtectedRoute>} />
          <Route path="/admin/reviews" element={<ProtectedRoute roles={['admin']}><AdminReviews /></ProtectedRoute>} />
          <Route path="/admin/flash-sales" element={<ProtectedRoute roles={['admin']}><AdminFlashSales /></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute roles={['admin']}><AdminLogs /></ProtectedRoute>} />
          <Route path="/admin/search-misses" element={<ProtectedRoute roles={['admin']}><AdminSearchMisses /></ProtectedRoute>} />
          {/* Employee Dashboard */}
          <Route path="/employee/claims" element={<ProtectedRoute roles={['employee']}><EmployeeClaims /></ProtectedRoute>} />
          <Route path="/employee/claims/:id" element={<ProtectedRoute roles={['employee']}><EmployeeClaimDetail /></ProtectedRoute>} />
          <Route path="/employee/reviews" element={<ProtectedRoute roles={['employee']}><EmployeeReviews /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
