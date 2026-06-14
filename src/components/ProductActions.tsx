"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ShoppingCart } from "lucide-react";

export default function ProductActions({ product }: { product: any }) {
  const router = useRouter();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    try {
      const saved = localStorage.getItem('brownis_cart');
      let cart = saved ? JSON.parse(saved) : [];
      
      const existing = cart.find((p: any) => p.id === product.id);
      if (existing) {
        cart = cart.map((p: any) => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      } else {
        if (cart.length >= 10) {
          alert("Keranjang penuh! Maksimal 10 jenis produk berbeda.");
          return;
        }
        cart.push({ id: product.id, name: product.name, price: Number(product.price), qty: 1, image_url: product.image_url });
      }
      
      localStorage.setItem('brownis_cart', JSON.stringify(cart));
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
      
      // Dispatch an event so the Navbar can update its cart count
      window.dispatchEvent(new Event('cart_updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleBuyNow = () => {
    router.push(`/checkout?add=${product.id}&t=${Date.now()}`);
  };

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px solid #f3f4f6" }}>
      <button 
        onClick={handleAddToCart}
        style={{
          flex: 1, fontSize: 12, fontWeight: 700, color: added ? "white" : "var(--primary)",
          backgroundColor: added ? "#10b981" : "transparent",
          border: `1.5px solid ${added ? "#10b981" : "var(--primary)"}`, 
          padding: "8px 12px", borderRadius: 10, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          transition: "all 0.2s"
        }}
      >
        <ShoppingCart size={14} /> {added ? "Tersimpan!" : "+ Keranjang"}
      </button>
      <button 
        onClick={handleBuyNow}
        style={{
          flex: 1, fontSize: 12, fontWeight: 700, color: "white",
          backgroundColor: "var(--primary)", border: "1.5px solid var(--primary)", 
          padding: "8px 12px", borderRadius: 10, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        <ShoppingBag size={14} /> Beli Langsung
      </button>
    </div>
  );
}
