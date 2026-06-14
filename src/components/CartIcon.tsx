"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function CartIcon() {
  const [count, setCount] = useState(0);

  const updateCount = () => {
    try {
      const saved = localStorage.getItem('brownis_cart');
      if (saved) {
        const cart = JSON.parse(saved);
        setCount(cart.reduce((total: number, item: any) => total + item.qty, 0));
      } else {
        setCount(0);
      }
    } catch (e) {
      setCount(0);
    }
  };

  useEffect(() => {
    updateCount();
    window.addEventListener('cart_updated', updateCount);
    return () => window.removeEventListener('cart_updated', updateCount);
  }, []);

  return (
    <Link href="/cart" style={{ position: "relative", display: "flex", alignItems: "center", color: "var(--secondary)", textDecoration: "none", marginRight: 8 }}>
      <ShoppingBag size={22} />
      {count > 0 && (
        <span style={{
          position: "absolute", top: -6, right: -8,
          backgroundColor: "var(--primary)", color: "white",
          fontSize: 10, fontWeight: 800, width: 18, height: 18,
          borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid white"
        }}>
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
