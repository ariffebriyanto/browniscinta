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
  const timestamp = searchParams?.get('t');
  
  const [shippingCost, setShippingCost] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [minDate, setMinDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
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
  const [isDirectBuy, setIsDirectBuy] = useState(false);
  const [uniqueCode, setUniqueCode] = useState(0);

  useEffect(() => {
    // Generate unique code on mount
    setUniqueCode(Math.floor(Math.random() * 900) + 100);
  }, []);

  useEffect(() => {
    if (addId) {
      setIsDirectBuy(true);
      // Direct Buy mode: Ignore persistent cart, load just this product
      getProductForCart(Number(addId)).then(product => {
        if (product) {
          const savedDirect = sessionStorage.getItem('brownis_direct_buy');
          let currentDirect = savedDirect ? JSON.parse(savedDirect) : null;
          let items: any[] = [];
          
          if (timestamp && currentDirect && currentDirect.t === timestamp) {
            // Same click (e.g. page refresh). Just load the session state.
            items = currentDirect.items || [];
          } else {
            // New click
            items = currentDirect?.items ? [...currentDirect.items] : [];
            const existingIndex = items.findIndex((i: any) => i.id === product.id);
            if (existingIndex !== -1) {
               // Increase quantity
               items[existingIndex] = { ...items[existingIndex], qty: items[existingIndex].qty + 1 };
            } else {
               // Add new product
               items.push({ id: product.id, name: product.name, price: Number(product.price), qty: 1, image_url: product.image_url });
            }
          }
          
          setCartItems(items);
          sessionStorage.setItem('brownis_direct_buy', JSON.stringify({ t: timestamp, items }));
        }
        setIsCartLoaded(true);
      });
    } else {
      // Cart Checkout mode: Load from persistent cart
      const saved = localStorage.getItem('brownis_cart');
      if (saved) {
        try { setCartItems(JSON.parse(saved)); } catch (e) {}
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

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const effectiveShipping = deliveryMode === "PICKUP" ? 0 : (useFreeShipping && isJogja ? 0 : shippingCost);
  const total = subtotal + effectiveShipping + uniqueCode;

  useEffect(() => {
    // Calculate H-2 for minimum date
    const date = new Date();
    date.setDate(date.getDate() + 2);
    date.setHours(10, 0, 0, 0); // Default to 10:00 AM
    
    // Format for datetime-local input (YYYY-MM-DDThh:mm) in local timezone
    const offset = date.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
    
    setMinDate(localISOTime);
    setDeliveryDate(localISOTime);
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

    const baseService = deliveryMode === "PICKUP" ? 'Ambil Sendiri di Toko' : (useFreeShipping && isJogja ? 'Gratis Ongkir (Wilayah Jogja)' : (shippingInfo?.service || 'JNE Reguler'));
    const formattedDate = new Date(deliveryDate).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).replace(/\./g, ':');
    
    const orderData = {
      userId,
      totalPrice: total,
      shippingCost: effectiveShipping,
      shippingService: `${baseService} (Waktu: ${formattedDate})`,
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
      if (!isDirectBuy) {
        localStorage.removeItem('brownis_cart');
        window.dispatchEvent(new Event('cart_updated')); // Force navbar update
      } else {
        sessionStorage.removeItem('brownis_direct_buy');
      }
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
            <h1 style={{ fontFamily: "var(--font-serif)", color: "var(--secondary)", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Checkout Pesanan</h1>
            <p style={{ fontSize: 13, color: "var(--text-light)" }}>Lengkapi informasi pengiriman untuk menyelesaikan pesanan Anda</p>
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
                  
                  {/* Date Selection */}
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

                  {/* Delivery Mode Toggle */}
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

                  {deliveryMode === "DELIVERY" ? (
                    <>
                      {/* Delivery Address */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>Alamat Lengkap Pengiriman</label>
                      <button
                        type="button"
                        onClick={() => setMapOpen(!mapOpen)}
                        style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        📍 {mapOpen ? "Tutup Peta" : "Pilih dari Peta"}
                      </button>
                    </div>

                    {mapOpen && (
                      <div style={{ marginBottom: 4 }}>
                        <div
                          id="checkout-map"
                          style={{ width: "100%", height: 220, borderRadius: 12, border: "1px solid #e5e7eb", backgroundColor: "#f9fafb", position: "relative", zIndex: 1 }}
                        >
                          {!leafletLoaded && (
                            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(249,250,251,0.8)", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>
                              🔄 Memuat peta interaktif...
                            </div>
                          )}
                        </div>
                        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                          👉 Geser pin biru ke lokasi Anda. Alamat akan terupdate otomatis.
                        </p>
                      </div>
                    )}

                    <textarea
                      style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "var(--font-sans)", boxSizing: "border-box", backgroundColor: "#f9fafb", resize: "none" }}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      placeholder="Tulis alamat lengkap Anda..."
                    ></textarea>

                    {/* Village Code Search */}
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                        Kelurahan / Desa Tujuan{" "}
                        <span style={{ color: "#ef4444", textTransform: "none", fontWeight: 400 }}>*wajib untuk hitung ongkir</span>
                      </label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          value={selectedVillage ? `${selectedVillage.name}, ${selectedVillage.district}, ${selectedVillage.regency}` : villageQuery}
                          onChange={(e) => { setSelectedVillage(null); setVillageQuery(e.target.value); setUseFreeShipping(false); }}
                          onFocus={() => { if (selectedVillage) setVillageQuery(''); setSelectedVillage(null); setUseFreeShipping(false); }}
                          placeholder="Cari nama desa/kelurahan (min 3 huruf)..."
                          style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", fontFamily: "var(--font-sans)", boxSizing: "border-box" }}
                        />
                        {villageLoading && (
                          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9ca3af" }}>Mencari...</span>
                        )}
                        {selectedVillage && (
                          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#10b981", fontWeight: 700 }}>✓</span>
                        )}
                      </div>

                      {villageResults.length > 0 && !selectedVillage && (
                        <div style={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)", maxHeight: 180, overflowY: "auto", marginTop: 4 }}>
                          {villageResults.map((v: any) => (
                            <button
                              key={v.code}
                              type="button"
                              onClick={() => {
                                setSelectedVillage({ code: v.code, name: v.name, district: v.district, regency: v.regency, province: v.province || '' });
                                setVillageQuery('');
                                setVillageResults([]);
                                setUseFreeShipping(false);
                                setShippingCost(0);
                                setShippingInfo(null);
                              }}
                              style={{ width: "100%", textAlign: "left", padding: "10px 16px", borderBottom: "1px solid #f3f4f6", background: "transparent", borderTop: "none", borderLeft: "none", borderRight: "none", cursor: "pointer" }}
                            >
                              <p style={{ fontWeight: 700, fontSize: 14, color: "var(--secondary)", margin: 0 }}>{v.name}</p>
                              <p style={{ fontSize: 11, color: "#9ca3af", margin: "2px 0 0" }}>{v.district}, {v.regency}, {v.province}</p>
                            </button>
                          ))}
                        </div>
                      )}
                      {villageQuery.length >= 3 && !villageLoading && villageResults.length === 0 && !selectedVillage && (
                        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Desa tidak ditemukan. Coba kata kunci lain.</p>
                      )}
                    </div>

                    {selectedVillage && (
                      <div style={{
                        display: "flex", alignItems: "flex-start", gap: 12, padding: 16, borderRadius: 12, border: "1px solid",
                        backgroundColor: isJogja ? "#ecfdf5" : "#f9fafb", borderColor: isJogja ? "#a7f3d0" : "#e5e7eb",
                        opacity: isJogja ? 1 : 0.6,
                      }}>
                        <input
                          type="checkbox"
                          id="free-shipping-check"
                          checked={useFreeShipping && isJogja}
                          disabled={!isJogja}
                          onChange={(e) => {
                            if (!isJogja) return;
                            setUseFreeShipping(e.target.checked);
                            if (e.target.checked) {
                              setShippingCost(0);
                              setShippingInfo({ estimated_days: 'Hari ini / Besok', service: 'Gratis Ongkir' });
                            } else {
                              setShippingCost(0);
                              setShippingInfo(null);
                            }
                          }}
                          style={{ width: 16, height: 16, accentColor: "#059669", cursor: isJogja ? "pointer" : "not-allowed", marginTop: 2, flexShrink: 0 }}
                        />
                        <label htmlFor="free-shipping-check" style={{ fontSize: 12, lineHeight: 1.5, cursor: isJogja ? "pointer" : "not-allowed" }}>
                          {isJogja ? (
                            <>
                              <span style={{ fontWeight: 700, color: "#047857", display: "block" }}>🎉 Gratis Ongkir untuk Wilayah Yogyakarta!</span>
                              <span style={{ color: "#059669", fontWeight: 600 }}>Centang untuk menggunakan pengiriman gratis ke {selectedVillage.regency}.</span>
                            </>
                          ) : (
                            <>
                              <span style={{ fontWeight: 700, color: "#6b7280", display: "block" }}>🚫 Gratis Ongkir tidak tersedia</span>
                              <span style={{ color: "#9ca3af", fontWeight: 600 }}>Promo gratis ongkir hanya untuk DI Yogyakarta. Tujuan Anda ({selectedVillage.province}) tidak memenuhi syarat.</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                    <div style={{ backgroundColor: "#ecfdf5", padding: 16, borderRadius: 12, border: "1px solid #a7f3d0", textAlign: "center" }}>
                      <p style={{ fontWeight: 700, color: "#047857", fontSize: 13, marginBottom: 4 }}>✅ Anda memilih Ambil di Toko</p>
                      <p style={{ fontSize: 11, color: "#059669", lineHeight: 1.5 }}>
                        Pesanan Anda bisa diambil di toko pada tanggal pengiriman yang dipilih. Ongkos kirim otomatis menjadi Rp 0.
                      </p>
                    </div>
                  )}

                  {/* Shipping Button */}
                  {deliveryMode === "DELIVERY" && (
                    <button
                      type="button"
                      onClick={calculateShipping}
                      disabled={isCalculating}
                      style={{
                        width: "100%", padding: "12px 20px", borderRadius: 12, border: "1.5px solid var(--primary)",
                        backgroundColor: "transparent", color: "var(--primary)", fontSize: 14, fontWeight: 700,
                        cursor: isCalculating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        opacity: isCalculating ? 0.6 : 1, transition: "background-color 0.2s"
                      }}
                    >
                      <Truck size={16} /> {isCalculating ? 'Menghitung Ongkir...' : selectedVillage ? `Hitung Ongkir ke ${selectedVillage.name}` : 'Hitung Ongkos Kirim'}
                    </button>
                  )}
                </div>
              </form>
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
                
                <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 13, color: "#6b7280", borderBottom: "1px dashed #e5e7eb", paddingBottom: 16 }}>
                  <div>
                    <span style={{ fontWeight: 600, display: "block" }}>
                      {deliveryMode === "PICKUP" ? '🏬 Ambil Sendiri di Toko' : (useFreeShipping && isJogja ? '🎉 Gratis Ongkir' : (shippingInfo?.service || 'Ongkos Kirim'))}
                    </span>
                    {shippingInfo && !useFreeShipping && deliveryMode === "DELIVERY" && (
                      <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, display: "block", marginTop: 2 }}>
                        {shippingInfo.estimated_days}{shippingInfo.is_estimate ? ' (estimasi)' : ''}
                      </span>
                    )}
                    {useFreeShipping && isJogja && deliveryMode === "DELIVERY" && (
                      <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700, display: "block", marginTop: 2 }}>Wilayah Yogyakarta</span>
                    )}
                  </div>
                  <span style={{ fontWeight: 700, color: (useFreeShipping && isJogja) || deliveryMode === "PICKUP" ? "#d1d5db" : "var(--secondary)", textDecoration: (useFreeShipping && isJogja) || deliveryMode === "PICKUP" ? "line-through" : "none" }}>
                    {deliveryMode === "PICKUP" ? `Rp 0` : (shippingCost > 0 ? `Rp ${shippingCost.toLocaleString('id-ID')}` : (useFreeShipping && isJogja ? `Rp 0` : '-'))}
                  </span>
                </div>

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

              {/* Payment Instructions */}
              <div style={{ backgroundColor: "#f9fafb", padding: 16, borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, color: "var(--secondary)", fontSize: 13, marginBottom: 4 }}>Instruksi Pembayaran</h3>
                <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, marginBottom: 12 }}>
                  Transfer persis sebesar total tagihan ke rekening berikut:
                </p>
                <div style={{ backgroundColor: "white", padding: 14, borderRadius: 12, border: "1px solid #fecdd3", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                  <p style={{ fontWeight: 800, color: "var(--primary)", fontSize: 18, fontFamily: "monospace", letterSpacing: 1 }}>BCA 2140639403</p>
                  <p style={{ color: "var(--secondary)", fontSize: 13, fontWeight: 700, marginTop: 4 }}>a/n Arif Febriyanto</p>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                form="checkout-form" 
                style={{
                  width: "100%", padding: "14px 20px", borderRadius: 12, border: "none",
                  backgroundColor: "var(--primary)", color: "white", fontSize: 15, fontWeight: 700,
                  cursor: (deliveryMode === "DELIVERY" && shippingCost === 0 && !(useFreeShipping && isJogja)) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: 8,
                  opacity: (deliveryMode === "DELIVERY" && shippingCost === 0 && !(useFreeShipping && isJogja)) ? 0.5 : 1,
                  boxShadow: "0 4px 16px rgba(139,28,49,0.25)"
                }}
                disabled={deliveryMode === "DELIVERY" && shippingCost === 0 && !(useFreeShipping && isJogja)}
              >
                Selesaikan Pesanan
              </button>
              
              {deliveryMode === "DELIVERY" && shippingCost === 0 && !(useFreeShipping && isJogja) && (
                <p style={{ textAlign: "center", fontSize: 11, color: "#ef4444", fontWeight: 600, marginTop: 12 }}>
                  *Silakan hitung ongkos kirim terlebih dahulu.
                </p>
              )}
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
