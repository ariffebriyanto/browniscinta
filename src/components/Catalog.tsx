'use client';

import { useState } from 'react';
import ProductActions from "./ProductActions";

export default function Catalog({ products, session, isOutsideJogja }: { products: any[], session: any, isOutsideJogja?: boolean }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'none' | 'asc' | 'desc' | 'sold'>('none');
  const [filterExpired, setFilterExpired] = useState<'all' | 'long' | 'short'>('all');

  let displayedProducts = [...products];

  if (searchQuery) {
    displayedProducts = displayedProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  if (filterExpired === 'long') {
    displayedProducts = displayedProducts.filter(p => p.expiration_days >= 7);
  } else if (filterExpired === 'short') {
    displayedProducts = displayedProducts.filter(p => p.expiration_days < 7);
  }

  if (sortBy === 'asc') {
    displayedProducts.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy === 'desc') {
    displayedProducts.sort((a, b) => Number(b.price) - Number(a.price));
  } else if (sortBy === 'sold') {
    displayedProducts.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
  }

  return (
    <div>
      {/* Filter and Sort UI */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
        <input 
          type="text" 
          placeholder="Cari nama produk..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid var(--border)", outline: "none", flex: 1, minWidth: 200, fontFamily: "var(--font-sans)", fontSize: 14 }}
        />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
          <select 
            value={filterExpired}
            onChange={(e) => setFilterExpired(e.target.value as any)}
            style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid var(--border)", outline: "none", backgroundColor: "white", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 14, minWidth: 200 }}
          >
            <option value="all">Semua Masa Simpan</option>
            <option value="long">Bertahan Lama (≥ 7 Hari)</option>
            <option value="short">Cepat Basi (&lt; 7 Hari)</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ padding: "10px 16px", borderRadius: 10, border: "1.5px solid var(--border)", outline: "none", backgroundColor: "white", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: 14, minWidth: 200 }}
          >
            <option value="none">Urutkan: Default</option>
            <option value="sold">Paling Banyak Dibeli</option>
            <option value="asc">Harga: Terendah ke Tertinggi</option>
            <option value="desc">Harga: Tertinggi ke Terendah</option>
          </select>
        </div>
      </div>

      {isOutsideJogja && (
        <div style={{ padding: "12px 16px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <p style={{ fontSize: 13, color: "#b45309", fontWeight: 700, margin: 0 }}>Penyesuaian Harga Luar Kota</p>
            <p style={{ fontSize: 12, color: "#d97706", margin: "2px 0 0 0" }}>Harga produk di bawah ini telah disesuaikan (+Rp 5.500) untuk pengiriman Luar DI Yogyakarta berdasarkan Alamat Utama Anda.</p>
          </div>
        </div>
      )}

      {/* Grid */}
      {displayedProducts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 20px", width: "100%", gridColumn: "1 / -1" }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🍰</p>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--secondary)", marginBottom: 8 }}>Produk Tidak Ditemukan</h3>
          <p style={{ fontSize: 14, color: "#9ca3af" }}>Katalog produk saat ini sedang kosong atau tidak ada produk yang cocok dengan pencarian Anda.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
        }}>
          {displayedProducts.map((product) => (
            <div key={product.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ position: "relative", overflow: "hidden", height: 200, backgroundColor: "#f9fafb" }}>
                <img
                  src={product.image_url || "/hero_bg.png"}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {product.is_bestseller && (
                  <span style={{
                    position: "absolute", top: 12, right: 12,
                    backgroundColor: "#f59e0b", color: "white",
                    fontSize: 10, fontWeight: 700, padding: "4px 10px",
                    borderRadius: 8, letterSpacing: 0.5, textTransform: "uppercase"
                  }}>
                    Best Seller ⭐
                  </span>
                )}
              </div>
              <div style={{ padding: "20px 20px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
                <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: "var(--secondary)", marginBottom: 6 }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5, flex: 1, marginBottom: 12 }}>
                  {product.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: product.expiration_days >= 7 ? "#059669" : "#dc2626", backgroundColor: product.expiration_days >= 7 ? "#d1fae5" : "#fee2e2", padding: "4px 8px", borderRadius: 6 }}>
                    ⏱️ Masa Simpan: {product.expiration_days} Hari
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: 18 }}>
                    Rp {Number(product.price).toLocaleString('id-ID')}
                  </span>
                  <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: 6 }}>
                    Terjual {product.soldCount || 0}
                  </span>
                </div>
                {session?.user?.role !== "OWNER" && (
                  <ProductActions product={product} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
