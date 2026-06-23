'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Calendar, MapPin, CreditCard, ChevronLeft, Truck, AlertTriangle } from 'lucide-react';
import { useSession } from "next-auth/react";
import { createOrder } from "../customer/dashboard/actions";
import { getProductForCart, getProductsForCart } from "./actions";
import { getUserProfile } from "../customer/profile/actions";

function CartCheckoutInner() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const addId = searchParams?.get('add');
  const timestamp = searchParams?.get('t');
  
  const [minDate, setMinDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<"DELIVERY" | "PICKUP">("DELIVERY");

  // User and Addresses
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [fullProductsData, setFullProductsData] = useState<any[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isDirectBuy, setIsDirectBuy] = useState(false);
  const [uniqueCode, setUniqueCode] = useState(0);

  useEffect(() => {
    // Generate unique code on mount
    setUniqueCode(Math.floor(Math.random() * 900) + 100);
    
    // Fetch user profile and addresses
    getUserProfile().then(profile => {
      if (profile && profile.addresses) {
        setAddresses(profile.addresses);
        const primary = profile.addresses.find((a: any) => a.is_primary);
        if (primary) setSelectedAddressId(primary.id);
        else if (profile.addresses.length > 0) setSelectedAddressId(profile.addresses[0].id);
      }
    });
  }, []);

  const loadFullProductData = async (items: any[]) => {
    if (items.length === 0) return;
    const ids = items.map(i => i.id);
    const products = await getProductsForCart(ids);
    setFullProductsData(products);
  };

  useEffect(() => {
    if (addId) {
      setIsDirectBuy(true);
      getProductForCart(Number(addId)).then(product => {
        if (product) {
          const savedDirect = sessionStorage.getItem('brownis_direct_buy');
          let currentDirect = savedDirect ? JSON.parse(savedDirect) : null;
          let items: any[] = [];
          
          if (timestamp && currentDirect && currentDirect.t === timestamp) {
            items = currentDirect.items || [];
          } else {
            items = currentDirect?.items ? [...currentDirect.items] : [];
            const existingIndex = items.findIndex((i: any) => i.id === product.id);
            if (existingIndex !== -1) {
               items[existingIndex] = { ...items[existingIndex], qty: items[existingIndex].qty + 1 };
            } else {
               items.push({ id: product.id, name: product.name, price: Number(product.price), qty: 1, image_url: product.image_url });
            }
          }
          
          setCartItems(items);
          loadFullProductData(items);
          sessionStorage.setItem('brownis_direct_buy', JSON.stringify({ t: timestamp, items }));
        }
        setIsCartLoaded(true);
      });
    } else {
      const saved = localStorage.getItem('brownis_cart');
      if (saved) {
        try { 
          const parsed = JSON.parse(saved);
          setCartItems(parsed); 
          loadFullProductData(parsed);
        } catch (e) {}
      }
      setIsCartLoaded(true);
    }
  }, [addId, timestamp]);

  const updateQty = (id: number, delta: number) => {
    setCartItems(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          return { ...item, qty: Math.max(1, item.qty + delta) };
        }
        return item;
      });
      if (!isDirectBuy) {
        localStorage.setItem('brownis_cart', JSON.stringify(next));
      } else {
        const savedDirect = sessionStorage.getItem('brownis_direct_buy');
        if (savedDirect) {
          const parsed = JSON.parse(savedDirect);
          parsed.items = next;
          sessionStorage.setItem('brownis_direct_buy', JSON.stringify(parsed));
        }
      }
      return next;
    });
  };

  const removeItem = (id: number) => {
    setCartItems(prev => {
      const next = prev.filter(item => item.id !== id);
      if (!isDirectBuy) {
        localStorage.setItem('brownis_cart', JSON.stringify(next));
      } else {
        const savedDirect = sessionStorage.getItem('brownis_direct_buy');
        if (savedDirect) {
          const parsed = JSON.parse(savedDirect);
          parsed.items = next;
          sessionStorage.setItem('brownis_direct_buy', JSON.stringify(parsed));
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(10, 0, 0, 0); 
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    setMinDate(localISOTime);
    setDeliveryDate(localISOTime);
  }, []);

  // Compute zone based on selected address
  const selectedAddress = addresses.find(a => a.id === selectedAddressId);
  const isJogja = deliveryMode === "PICKUP" || (selectedAddress?.is_jogja === true);
  const isJava = !isJogja && (selectedAddress?.is_java === true);
  const isOuterJava = !isJogja && !isJava;
  const isOutsideJogja = !isJogja;

  // Flat shipping per order based on zone
  const shippingCost = deliveryMode === "PICKUP" ? 0
    : isJogja ? 0
    : isJava ? 20000
    : 40000;

  // Enhance cart items with server data and custom pricing
  let hasShortExpiration = false;
  
  const enhancedCartItems = cartItems.map(item => {
    const serverProduct = fullProductsData.find(p => p.id === item.id);
    const expirationDays = serverProduct?.expiration_days || 0;
    
    // Check if outside Jogja and expiration is less than 7
    if (isOutsideJogja && expirationDays < 7) {
      hasShortExpiration = true;
    }

    // Use real server base price (no per-product surcharge)
    const basePrice = serverProduct ? Number(serverProduct.price) : Number(item.price);

    return {
      ...item,
      expiration_days: expirationDays,
      displayPrice: basePrice,
      subtotal: basePrice * item.qty
    };
  });

  const cartSubtotal = enhancedCartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = enhancedCartItems.reduce((sum, item) => sum + item.qty, 0);

  // Promo Logic: Beli >= 10, Gratis Potongan
  let promoDiscount = 0;
  if (totalItems >= 10 && deliveryMode === "DELIVERY") {
    if (isJava) promoDiscount = 5000;
    else if (isOuterJava) promoDiscount = 10000;
  }

  const total = cartSubtotal + shippingCost - promoDiscount + uniqueCode;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      alert("Keranjang belanja Anda kosong. Silakan tambah produk terlebih dahulu.");
      return;
    }

    if (!session) {
      alert("Silakan login terlebih dahulu untuk melakukan pemesanan.");
      router.push("/login?callbackUrl=/cart");
      return;
    }

    if (deliveryMode === "DELIVERY" && !selectedAddress) {
      alert("Silakan pilih atau tambahkan alamat pengiriman terlebih dahulu di halaman Profil.");
      return;
    }

    if (isOutsideJogja && hasShortExpiration) {
      alert("Pesanan tidak dapat dilanjutkan. Pengiriman ke luar DI Yogyakarta hanya mendukung produk dengan masa expired minimal 7 hari.");
      return;
    }

    const userId = parseInt((session.user as any).id);
    if (isNaN(userId)) {
      alert("Gagal memproses user ID. Silakan coba login kembali.");
      return;
    }

    const baseService = deliveryMode === "PICKUP" 
      ? 'Ambil Sendiri di Toko' 
      : isJogja ? 'Pengiriman DI Yogyakarta (Gratis)'
      : isJava ? 'Pengiriman Dalam Jawa (+Rp 20.000)'
      : 'Pengiriman Luar Jawa (+Rp 40.000)';
      
    const formattedDate = new Date(deliveryDate).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
    const promoText = promoDiscount > 0 ? ` | Promo Potongan Ongkir: -Rp ${promoDiscount.toLocaleString('id-ID')}` : '';
    const shippingService = `${baseService} (Waktu: ${formattedDate})${selectedAddress ? ` | Penerima: ${selectedAddress.recipient_name} | Alamat: ${selectedAddress.full_address}` : ''}${promoText}`;
    
    const orderData = {
      userId,
      totalPrice: total,
      shippingCost: shippingCost,
      shippingService: shippingService,
      items: enhancedCartItems.map(item => ({
        productId: item.id,
        quantity: item.qty,
        price: item.displayPrice
      }))
    };

    const result = await createOrder(orderData);
    if (result.error) {
      alert("Gagal membuat pesanan: " + result.error);
    } else {
      if (!isDirectBuy) {
        localStorage.removeItem('brownis_cart');
        window.dispatchEvent(new Event('cart_updated')); 
      } else {
        sessionStorage.removeItem('brownis_direct_buy');
      }
      setCartItems([]);
      alert('Pesanan berhasil dibuat! Silakan upload bukti transfer di halaman Dashboard.');
      router.push('/customer/dashboard');
    }
  };

  if (!isCartLoaded) return <div style={{ padding: 40, textAlign: "center" }}>Memuat checkout...</div>;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)"
      }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 14 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src="/logo.png" alt="Logo" style={{ height: 50, objectFit: "contain" }} />
            <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--primary)", fontSize: 20 }}>Brownis Cinta</span>
          </Link>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
            <ChevronLeft size={16} /> Kembali ke Beranda
          </Link>
        </div>
      </nav>

      <main style={{ flex: 1, paddingTop: 32, paddingBottom: 40 }}>
        <div className="container">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "var(--font-serif)", color: "var(--secondary)", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Checkout Pesanan</h1>
            <p style={{ fontSize: 13, color: "var(--text-light)" }}>Lengkapi informasi pengiriman untuk menyelesaikan pesanan Anda</p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* Shopping List */}
              <div className="card" style={{ padding: "24px 28px" }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 16 }}>
                  <ShoppingBag size={16} color="var(--primary)" /> Daftar Belanja Anda
                </h2>

                {isOutsideJogja && (
                  <div style={{ padding: 12, backgroundColor: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, marginBottom: 16 }}>
                    <p style={{ fontSize: 12, color: "#d97706", fontWeight: 700, margin: 0 }}>
                      ⚠️ Pengiriman Luar DI Yogyakarta
                    </p>
                    <p style={{ fontSize: 11, color: "#b45309", margin: "4px 0 0 0" }}>
                      Karena pengiriman berada di luar DI Yogyakarta, pastikan produk yang Anda pilih memiliki masa expired minimal 7 hari agar aman sampai tujuan.
                    </p>
                  </div>
                )}
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {enhancedCartItems.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", backgroundColor: "#f9fafb", flexShrink: 0 }}>
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Cake"; }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{item.name}</h3>
                          <p style={{ fontSize: 11, color: item.expiration_days >= 7 ? "#10b981" : "#ef4444", marginBottom: 6, fontWeight: 600 }}>
                            Masa Expired: {item.expiration_days} Hari
                          </p>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
                              <button type="button" onClick={() => updateQty(item.id, -1)} style={{ padding: "2px 8px", background: "#f9fafb", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#6b7280" }}>-</button>
                              <span style={{ padding: "2px 12px", fontSize: 12, fontWeight: 700, color: "#111827", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", minWidth: 24, textAlign: "center" }}>{item.qty}</span>
                              <button type="button" onClick={() => updateQty(item.id, 1)} style={{ padding: "2px 8px", background: "#f9fafb", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, color: "#6b7280" }}>+</button>
                            </div>
                            <button type="button" onClick={() => removeItem(item.id)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 11, fontWeight: 700, padding: 0 }}>Hapus</button>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: 15, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                        Rp {item.subtotal.toLocaleString('id-ID')}
                        {isOutsideJogja && (
                          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400 }}>
                            (Rp {item.displayPrice.toLocaleString('id-ID')} / pcs)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {cartItems.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px 0", backgroundColor: "#f9fafb", borderRadius: 12, border: "1px dashed var(--border)" }}>
                      <ShoppingBag size={32} color="#d1d5db" style={{ margin: "0 auto 8px auto" }} />
                      <p style={{ color: "#9ca3af", fontSize: 13, fontWeight: 600 }}>Keranjang belanja Anda kosong.</p>
                    </div>
                  )}
                </div>
                
                {!isDirectBuy && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", textAlign: "center" }}>
                    <Link href="/cart" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none", padding: "8px 16px", borderRadius: 8, backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
                      &lt; Kembali ke Keranjang
                    </Link>
                  </div>
                )}
              </div>

              {/* Delivery & Schedule Form */}
              <form onSubmit={handleCheckout} id="checkout-form">
                <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px 28px" }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                    <MapPin size={16} color="var(--primary)" /> Informasi Pengiriman & Jadwal
                  </h2>
                  
                  <div style={{ backgroundColor: "#fff1f2", padding: 16, borderRadius: 12, border: "1px solid #fecdd3" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                      <Calendar size={14} /> Waktu Pengiriman / Pengambilan (Indent H-2)
                    </label>
                    <input 
                      type="datetime-local" 
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "var(--font-sans)", boxSizing: "border-box", marginBottom: 8 }}
                      required 
                      min={minDate} 
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                    />
                    <p style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>
                      Semua kue dibuat fresh harian secara higienis, sehingga pesanan minimal diproses 2 hari sebelum pengiriman.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <button 
                      type="button" 
                      onClick={() => setDeliveryMode("DELIVERY")}
                      style={{ flex: 1, padding: "12px", borderRadius: 12, border: deliveryMode === "DELIVERY" ? "2px solid var(--primary)" : "1px solid #e5e7eb", backgroundColor: deliveryMode === "DELIVERY" ? "#fff1f2" : "#f9fafb", fontWeight: 700, color: deliveryMode === "DELIVERY" ? "var(--primary)" : "#6b7280", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      🚚 Kirim ke Alamat
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setDeliveryMode("PICKUP")}
                      style={{ flex: 1, padding: "12px", borderRadius: 12, border: deliveryMode === "PICKUP" ? "2px solid var(--primary)" : "1px solid #e5e7eb", backgroundColor: deliveryMode === "PICKUP" ? "#fff1f2" : "#f9fafb", fontWeight: 700, color: deliveryMode === "PICKUP" ? "var(--primary)" : "#6b7280", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      🏬 Ambil di Toko
                    </button>
                  </div>

                  {deliveryMode === "DELIVERY" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#4b5563" }}>Pilih Alamat Pengiriman</label>
                      
                      {addresses.length === 0 ? (
                        <div style={{ padding: 16, border: "1px dashed var(--border)", borderRadius: 12, textAlign: "center" }}>
                          <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Belum ada alamat tersimpan.</p>
                          <Link href="/customer/profile" style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "underline" }}>
                            Tambah Alamat di Profil
                          </Link>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {addresses.map(addr => (
                            <label key={addr.id} style={{
                              display: "flex", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 12,
                              border: selectedAddressId === addr.id ? "2px solid var(--primary)" : "1px solid #e5e7eb",
                              backgroundColor: selectedAddressId === addr.id ? "#fff1f2" : "#ffffff",
                              cursor: "pointer", transition: "all 0.2s"
                            }}>
                              <input 
                                type="radio" 
                                name="addressSelection" 
                                checked={selectedAddressId === addr.id}
                                onChange={() => setSelectedAddressId(addr.id)}
                                style={{ width: 16, height: 16, accentColor: "var(--primary)", marginTop: 2 }}
                              />
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{addr.recipient_name}</span>
                                  <span style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, backgroundColor: addr.is_jogja ? "#ecfdf5" : addr.is_java ? "#eff6ff" : "#fef3c7", color: addr.is_jogja ? "#059669" : addr.is_java ? "#2563eb" : "#d97706", fontWeight: 700 }}>
                                    {addr.is_jogja ? "🏠 DI Yogyakarta" : addr.is_java ? "🚚 Dalam Jawa" : "✈️ Luar Jawa"}
                                  </span>
                                </div>
                                <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>{addr.phone}</p>
                                <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>{addr.full_address}</p>
                              </div>
                            </label>
                          ))}
                          <Link href="/customer/profile" style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textAlign: "right", display: "block" }}>
                            + Kelola Alamat Baru
                          </Link>
                        </div>
                      )}

                      {isOutsideJogja && hasShortExpiration && (
                        <div style={{ padding: 16, backgroundColor: "#fef2f2", border: "1px solid #f87171", borderRadius: 12, display: "flex", gap: 12, alignItems: "flex-start", marginTop: 8 }}>
                          <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c", margin: "0 0 4px 0" }}>Tidak Dapat Melanjutkan Checkout</p>
                            <p style={{ fontSize: 12, color: "#dc2626", margin: 0, lineHeight: 1.5 }}>
                              Alamat tujuan berada di luar DI Yogyakarta, namun terdapat produk di keranjang Anda yang memiliki masa expired di bawah 7 hari. Silakan hapus produk tersebut untuk melanjutkan.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {deliveryMode === "PICKUP" && (
                    <div style={{ backgroundColor: "#ecfdf5", padding: 16, borderRadius: 12, border: "1px solid #a7f3d0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                      <div>
                        <p style={{ fontWeight: 700, color: "#047857", fontSize: 13, marginBottom: 4 }}>✅ Anda memilih Ambil di Toko</p>
                        <p style={{ fontSize: 11, color: "#059669", lineHeight: 1.5, margin: 0 }}>
                          Pesanan Anda bisa diambil di toko pada tanggal pengiriman yang dipilih.
                        </p>
                      </div>
                      <div style={{ backgroundColor: "#ffffff", padding: "12px 16px", borderRadius: 8, border: "1px solid #6ee7b7", width: "100%" }}>
                        <p style={{ fontWeight: 700, fontSize: 12, color: "#166534", marginBottom: 4 }}>Lokasi Pengambilan:</p>
                        <p style={{ fontSize: 12, color: "#15803d", marginBottom: 12, lineHeight: 1.4 }}>
                          Toko Brownis Cinta<br/>
                          Jalan Jambon, Gamping
                        </p>
                        <a href="https://share.google/9ew7ETX5utaPmuVKP" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "white", backgroundColor: "#059669", padding: "8px 16px", borderRadius: 8, textDecoration: "none", transition: "background-color 0.2s" }}>
                          📍 Buka Peta Toko (Google Maps)
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div>
              <div className="card" style={{ position: "sticky", top: 80, padding: "24px 28px" }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 16 }}>
                  <CreditCard size={16} color="var(--primary)" /> Ringkasan Pembayaran
                </h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
                    <span style={{ fontWeight: 600 }}>Subtotal Produk</span>
                    <span style={{ fontWeight: 700, color: "var(--secondary)" }}>Rp {cartSubtotal.toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
                    <div>
                      <span style={{ fontWeight: 600, display: "block" }}>Ongkos Kirim</span>
                      {deliveryMode === "PICKUP" && <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700, display: "block", marginTop: 2 }}>Ambil di Toko</span>}
                      {deliveryMode === "DELIVERY" && isJogja && <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700, display: "block", marginTop: 2 }}>🏠 DI Yogyakarta</span>}
                      {deliveryMode === "DELIVERY" && isJava && <span style={{ fontSize: 11, color: "#2563eb", fontWeight: 700, display: "block", marginTop: 2 }}>🚚 Dalam Jawa</span>}
                      {deliveryMode === "DELIVERY" && isOuterJava && <span style={{ fontSize: 11, color: "#d97706", fontWeight: 700, display: "block", marginTop: 2 }}>✈️ Luar Jawa</span>}
                    </div>
                    <span style={{ fontWeight: 700, color: shippingCost === 0 ? "#10b981" : "var(--secondary)" }}>
                      {shippingCost === 0 ? "Gratis" : `Rp ${shippingCost.toLocaleString('id-ID')}`}
                    </span>
                  </div>

                  {promoDiscount > 0 && (
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 13, color: "#10b981", marginTop: "-4px" }}>
                      <span style={{ fontWeight: 600 }}>Promo Diskon Ongkir</span>
                      <span style={{ fontWeight: 700 }}>-Rp {promoDiscount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  {uniqueCode > 0 && (
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 13, color: "#6b7280", borderBottom: "1px dashed #e5e7eb", paddingBottom: 16, paddingTop: 16 }}>
                      <span style={{ fontWeight: 600 }}>Kode Unik (Untuk Verifikasi)</span>
                      <span style={{ fontWeight: 700, color: "#10b981" }}>Rp {uniqueCode.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16 }}>
                    <span style={{ fontWeight: 700, color: "var(--secondary)", fontSize: 15 }}>Total Tagihan</span>
                    <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: 22 }}>
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div style={{ backgroundColor: "#f9fafb", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 700, color: "var(--secondary)", fontSize: 13, marginBottom: 4 }}>Instruksi Pembayaran</h3>
                  <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, marginBottom: 12 }}>
                    Transfer persis sebesar total tagihan ke rekening berikut:
                  </p>
                  <div style={{ backgroundColor: "white", padding: "20px 14px", borderRadius: 12, border: "1px solid #fecdd3", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Bank_Central_Asia.svg" alt="BCA Logo" style={{ height: 28, marginBottom: 12 }} />
                    <p style={{ fontWeight: 800, color: "#111827", fontSize: 22, fontFamily: "monospace", letterSpacing: 2, marginBottom: 4 }}>2140639403</p>
                    <p style={{ color: "var(--secondary)", fontSize: 13, fontWeight: 700 }}>a/n Arif Febriyanto</p>
                  </div>
                </div>

                <button 
                  type="submit" 
                  form="checkout-form" 
                  disabled={cartItems.length === 0 || (deliveryMode === "DELIVERY" && !selectedAddress) || (isOutsideJogja && hasShortExpiration)}
                  style={{ 
                    width: "100%", padding: "16px", borderRadius: 12, border: "none", 
                    backgroundColor: "var(--primary)", color: "white", fontSize: 16, fontWeight: 700,
                    cursor: (cartItems.length === 0 || (deliveryMode === "DELIVERY" && !selectedAddress) || (isOutsideJogja && hasShortExpiration)) ? "not-allowed" : "pointer", 
                    opacity: (cartItems.length === 0 || (deliveryMode === "DELIVERY" && !selectedAddress) || (isOutsideJogja && hasShortExpiration)) ? 0.6 : 1, 
                    boxShadow: "0 4px 14px rgba(139,28,49,0.3)" 
                  }}
                >
                  Konfirmasi & Bayar Sekarang
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default function CartCheckout() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading...</div>}>
      <CartCheckoutInner />
    </Suspense>
  );
}
