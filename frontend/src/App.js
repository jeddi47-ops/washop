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
                  {/* Phase 2-4: client, vendor, admin, employee dashboards */}
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
