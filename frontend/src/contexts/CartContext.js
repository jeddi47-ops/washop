import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

function loadCart() {
  try { return JSON.parse(localStorage.getItem('washop_cart')) || { vendorId: null, vendorName: null, items: [] }; }
  catch { return { vendorId: null, vendorName: null, items: [] }; }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);
  const [open, setOpen] = useState(false);

  useEffect(() => { localStorage.setItem('washop_cart', JSON.stringify(cart)); }, [cart]);

  const addItem = (product, vendor, quantity = 1) => {
    setCart(prev => {
      if (prev.vendorId && prev.vendorId !== vendor.id) {
        return { needsConfirm: true, pendingProduct: product, pendingVendor: vendor, pendingQty: quantity, ...prev };
      }
      const existing = prev.items.find(i => i.product_id === product.id);
      if (existing) {
        return { ...prev, vendorId: vendor.id, vendorName: vendor.shop_name,
          items: prev.items.map(i => i.product_id === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) } : i) };
      }
      return { ...prev, vendorId: vendor.id, vendorName: vendor.shop_name,
        items: [...prev.items, { product_id: product.id, name: product.name, price: product.flash_sale?.discounted_price || product.price, original_price: product.price, image: product.images?.[0]?.cloudinary_url, quantity, stock: product.stock, flash_sale: !!product.flash_sale }] };
    });
    setOpen(true);
  };

  const confirmSwitch = () => {
    setCart(prev => {
      if (!prev.pendingProduct) return prev;
      const p = prev.pendingProduct, v = prev.pendingVendor, q = prev.pendingQty;
      return { vendorId: v.id, vendorName: v.shop_name, items: [{ product_id: p.id, name: p.name, price: p.flash_sale?.discounted_price || p.price, original_price: p.price, image: p.images?.[0]?.cloudinary_url, quantity: q, stock: p.stock, flash_sale: !!p.flash_sale }] };
    });
  };

  const cancelSwitch = () => setCart(prev => { const { needsConfirm, pendingProduct, pendingVendor, pendingQty, ...rest } = prev; return rest; });
  const updateQty = (productId, qty) => setCart(prev => ({ ...prev, items: prev.items.map(i => i.product_id === productId ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) } : i) }));
  const removeItem = (productId) => setCart(prev => { const items = prev.items.filter(i => i.product_id !== productId); return items.length ? { ...prev, items } : { vendorId: null, vendorName: null, items: [] }; });
  const clearCart = () => setCart({ vendorId: null, vendorName: null, items: [] });
  const total = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = cart.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, open, setOpen, addItem, confirmSwitch, cancelSwitch, updateQty, removeItem, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
