import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { LangProvider } from './contexts/LangContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/shared/CartDrawer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import ShopPage from './pages/ShopPage';
import SearchPage from './pages/SearchPage';
import About from './pages/About';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
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
import './App.css';

function SplashScreen({ onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 1200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="text-center animate-fade-scale">
        <img src="/logo.png" alt="Washop" className="h-24 w-24 rounded-2xl mx-auto mb-4 object-cover" />
        <p className="text-xl font-bold">Wa<span className="text-[#25D366]">shop</span></p>
        <div className="mt-6 w-48 h-1 bg-[#1A1A1A] rounded-full mx-auto overflow-hidden">
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
            <div className={`min-h-screen bg-black ${splash ? 'opacity-0' : 'opacity-100 transition-opacity duration-500'}`}>
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
                  {/* Phase 4: admin, employee dashboards */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  );
}
