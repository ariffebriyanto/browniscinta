'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, Calendar, MapPin, CreditCard, ChevronLeft, Truck } from 'lucide-react';
import { useSession } from "next-auth/react";
import { createOrder } from "../customer/dashboard/actions";
import { getProductForCart } from "./actions";

function CartCheckoutInner() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const addId = searchParams?.get('add');
  
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [minDate, setMinDate] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [shippingInfo, setShippingInfo] = useState<{ estimated_days: string; service?: string; is_estimate?: boolean; couriers?: any[] } | null>(null);

  // Map and Address states
  const [address, setAddress] = useState("Jalan Jambon, Gamping, Yogyakarta, -7.7647423, 110.3494548");
  const [customerCoords, setCustomerCoords] = useState<{lat: number, lng: number}>({ lat: -7.7647423, lng: 110.3494548 });
  const [mapOpen, setMapOpen] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Village code search
  const [villageQuery, setVillageQuery] = useState('');
  const [villageResults, setVillageResults] = useState<any[]>([]);
  const [villageLoading, setVillageLoading] = useState(false);
  const [selectedVillage, setSelectedVillage] = useState<{ code: string; name: string; district: string; regency: string; province: string } | null>(null);

  // Free shipping
  const [useFreeShipping, setUseFreeShipping] = useState(false);
  const isJogja = selectedVillage?.province?.toUpperCase().includes('YOGYAKARTA') ?? false;

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('brownis_cart');
    if (saved) {
      try { setCartItems(JSON.parse(saved)); } catch (e) {}
    }
    setIsCartLoaded(true);
  }, []);

  useEffect(() => {
    if (!isCartLoaded) return;
    if (addId) {
      getProductForCart(Number(addId)).then(product => {
        if (product) {
          setCartItems(prev => {
            const existing = prev.find(p => p.id === product.id);
            let nextCart;
            if (existing) {
              nextCart = prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
            } else {
              nextCart = [...prev, { id: product.id, name: product.name, price: Number(product.price), qty: 1, image_url: product.image_url }];
            }
            localStorage.setItem('brownis_cart', JSON.stringify(nextCart));
            return nextCart;
          });
        }
        router.replace('/cart');
      });
    }
  }, [addId, isCartLoaded, router]);

  const updateQty = (id: number, delta: number) => {
    setCartItems(prev => {
      const next = prev.map(item => {
        if (item.id === id) {
          return { ...item, qty: Math.max(1, item.qty + delta) };
        }
        return item;
      });
      localStorage.setItem('brownis_cart', JSON.stringify(next));
      return next;
    });
  };

  const removeItem = (id: number) => {
    setCartItems(prev => {
      const next = prev.filter(item => item.id !== id);
      localStorage.setItem('brownis_cart', JSON.stringify(next));
      return next;
    });
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const effectiveShipping = deliveryMode === "PICKUP" ? 0 : (useFreeShipping && isJogja ? 0 : shippingCost);
  const total = subtotal + effectiveShipping;

  useEffect(() => {
    // Calculate H-2 for minimum date
    const date = new Date();
    date.setDate(date.getDate() + 2);
    setMinDate(date.toISOString().split('T')[0]);
  }, []);

  // Dynamically load Leaflet script and CSS when map toggle is active
  useEffect(() => {
    if (!mapOpen || leafletLoaded) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, [mapOpen, leafletLoaded]);

  // Handle Map and Marker initialization and updates
  useEffect(() => {
    if (!leafletLoaded || !mapOpen) return;

    const L = (window as any).L;
    if (!L) return;

    const mapContainer = document.getElementById("checkout-map");
    if (!mapContainer) return;

    const storeCoords: [number, number] = [-7.7647423, 110.3494548]; // Jalan Jambon, Gamping
    const initialCoords: [number, number] = [customerCoords.lat, customerCoords.lng];

    const map = L.map("checkout-map").setView(initialCoords, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Custom pins: black/gold for store, draggable blue for customer
    const storeMarker = L.marker(storeCoords, {
      title: "Toko Brownis Cinta (Gamping)"
    }).addTo(map).bindPopup("<b>Toko Brownis Cinta</b><br/>Jalan Jambon, Gamping").openPopup();

    const customerMarker = L.marker(initialCoords, {
      draggable: true,
      title: "Geser ke Lokasi Anda"
    }).addTo(map).bindPopup("<b>Lokasi Pengiriman Anda</b><br/>Geser pin ini untuk mengubah lokasi.");

    customerMarker.on("dragend", async (e: any) => {
      const position = e.target.getLatLng();
      const newLat = position.lat;
      const newLng = position.lng;
      setCustomerCoords({ lat: newLat, lng: newLng });

      // Run reverse-lookup to Nominatim OpenStreetMap geocoder API
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`);
        if (res.ok) {
          const data = await res.json();
          const displayAddress = data.display_name || `Koordinat: ${newLat.toFixed(5)}, ${newLng.toFixed(5)}`;
          setAddress(`${displayAddress}, ${newLat.toFixed(7)}, ${newLng.toFixed(7)}`);
        } else {
          setAddress(`Koordinat: ${newLat.toFixed(7)}, ${newLng.toFixed(7)}`);
        }
      } catch (err) {
        setAddress(`Koordinat: ${newLat.toFixed(7)}, ${newLng.toFixed(7)}`);
      }
    });

    return () => {
      map.remove();
    };
  }, [leafletLoaded, mapOpen]);

  // Village search debounce
  useEffect(() => {
    if (villageQuery.length < 3) { setVillageResults([]); return; }
    const timer = setTimeout(async () => {
      setVillageLoading(true);
      try {
        const res = await fetch(`/api/villages?search=${encodeURIComponent(villageQuery)}`);
        const data = await res.json();
        setVillageResults(data.results || []);
      } catch { setVillageResults([]); }
      finally { setVillageLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [villageQuery]);

  const calculateShipping = async () => {
    setIsCalculating(true);
    try {
      const body: any = { destination: address, weight: 1000 };
      if (selectedVillage) body.destination_village_code = selectedVillage.code;

      const res = await fetch("/api/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setShippingCost(data.cost);
        setShippingInfo({
          estimated_days: data.estimated_days,
          service: data.service,
          is_estimate: data.is_estimate,
          couriers: data.couriers,
        });
      } else {
        alert("Gagal menghitung ongkos kirim: " + (data.error || "Error tidak diketahui"));
      }
    } catch (error: any) {
      alert("Gagal menghitung ongkos kirim: " + error.message);
    } finally {
      setIsCalculating(false);
    }
  };

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

    const userId = parseInt((session.user as any).id);
    if (isNaN(userId)) {
      alert("Gagal memproses user ID. Silakan coba login kembali.");
      return;
    }

    const orderData = {
      userId,
      totalPrice: total,
      shippingCost: effectiveShipping,
      shippingService: deliveryMode === "PICKUP" ? 'Ambil Sendiri di Toko' : (useFreeShipping && isJogja ? 'Gratis Ongkir (Wilayah Jogja)' : (shippingInfo?.service || 'JNE Reguler')),
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.qty,
        price: item.price
      }))
    };

    const result = await createOrder(orderData);
    if (result.error) {
      alert("Gagal membuat pesanan: " + result.error);
    } else {
      localStorage.removeItem('brownis_cart');
      setCartItems([]);
      alert('Pesanan berhasil dibuat! Silakan upload bukti transfer di halaman Dashboard.');
      router.push('/customer/dashboard');
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      
      {/* Header Navigation */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)"
      }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 14 }}>
          <Link href="/" style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--primary)", fontSize: 18, textDecoration: "none" }}>
            Brownis Cinta
          </Link>
          <Link 
            href="/" 
            style={{ fontSize: 13, fontWeight: 700, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}
          >
            <ChevronLeft size={16} /> Kembali ke Beranda
          </Link>
        </div>
      </nav>

      {/* Main Checkout Flow */}
      <main style={{ flex: 1, paddingTop: 32, paddingBottom: 40 }}>
        <div className="container">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "var(--font-serif)", color: "var(--secondary)", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Keranjang Belanja</h1>
            <p style={{ fontSize: 13, color: "var(--text-light)" }}>Periksa kembali daftar pesanan Anda sebelum melanjutkan ke pembayaran</p>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
            
            {/* Left Column: Cart Items & Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
              {/* Shopping List */}
              <div className="card" style={{ padding: "24px 28px" }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 16 }}>
                  <ShoppingBag size={16} color="var(--primary)" /> Daftar Belanja Anda
                </h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {cartItems.map((item) => (
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
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 6 }}>{item.name}</h3>
                          
                          {/* QTY Control */}
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
                        Rp {(item.price * item.qty).toLocaleString('id-ID')}
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
                
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)", textAlign: "center" }}>
                  <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none", padding: "8px 16px", borderRadius: 8, backgroundColor: "#fff1f2", border: "1px solid #fecdd3" }}>
                    + Tambah Produk Lain (Lanjut Belanja)
                  </Link>
                </div>
              </div>
              {/* Delivery & Schedule Form removed from Cart (moved to Checkout page) */}
            </div>

          {/* Right Column: Summary & Payment */}
          <div>
            <div className="card" style={{ position: "sticky", top: 80, padding: "24px 28px" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--secondary)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 16 }}>
                <CreditCard size={16} color="var(--primary)" /> Ringkasan Pembayaran
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 13, color: "#6b7280" }}>
                  <span style={{ fontWeight: 600 }}>Subtotal</span>
                  <span style={{ fontWeight: 700, color: "var(--secondary)" }}>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                


                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
                  <span style={{ fontWeight: 700, color: "var(--secondary)", fontSize: 15 }}>Total Tagihan</span>
                  <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: 22 }}>
                    Rp {total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <Link 
                href={cartItems.length > 0 ? "/checkout" : "#"}
                style={{
                  width: "100%", padding: "14px 20px", borderRadius: 12, border: "none", textDecoration: "none",
                  backgroundColor: cartItems.length > 0 ? "var(--primary)" : "#d1d5db", color: "white", fontSize: 15, fontWeight: 700,
                  cursor: cartItems.length > 0 ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: cartItems.length > 0 ? "0 4px 16px rgba(139,28,49,0.25)" : "none"
                }}
                onClick={(e) => {
                  if (cartItems.length === 0) {
                    e.preventDefault();
                    alert("Keranjang belanja kosong!");
                  }
                }}
              >
                Lanjut ke Pembayaran
              </Link>
            </div>
          </div>

        </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: "var(--secondary)", color: "white", marginTop: "auto" }}>
        <div className="container" style={{ paddingTop: 28, paddingBottom: 28, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>© 2026 Brownis Cinta Official. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

export default function CartCheckout() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#9ca3af", fontWeight: 700 }}>Memuat keranjang...</div>}>
      <CartCheckoutInner />
    </Suspense>
  );
}
