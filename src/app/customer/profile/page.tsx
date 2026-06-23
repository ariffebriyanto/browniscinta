'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile, updateUserProfile, addAddress, updateAddress, deleteAddress } from './actions';
import Link from 'next/link';
import { ChevronLeft, User, Phone, Lock, MapPin, Plus, Trash2, Edit2, Star, Map, Search, Navigation } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    password: ''
  });
  const [addresses, setAddresses] = useState<any[]>([]);

  // Address Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [addressForm, setAddressForm] = useState<any>({
    recipient_name: '',
    phone: '',
    full_address: '',
    is_jogja: null,
    is_primary: false
  });

  // Map States
  const [mapOpen, setMapOpen] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [customerCoords, setCustomerCoords] = useState<{lat: number, lng: number}>({ lat: -7.7647423, lng: 110.3494548 }); // Default to Jogja
  
  // Search Map States
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);

  // Refs for Leaflet objects so we can control them outside useEffect
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const loadProfile = async () => {
    setLoading(true);
    const data = await getUserProfile();
    if (data) {
      setProfileData({
        name: data.name || '',
        phone: data.phone || '',
        password: ''
      });
      setAddresses(data.addresses || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProfile();
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

  const fetchReverseGeocoding = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        const displayAddress = data.display_name || `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        
        let isJogja = false;
        if (data.address) {
          const state = data.address.state || data.address.province || '';
          const city = data.address.city || data.address.county || '';
          if (state.toLowerCase().includes('yogyakarta') || city.toLowerCase().includes('yogyakarta') || city.toLowerCase().includes('sleman') || city.toLowerCase().includes('bantul') || city.toLowerCase().includes('gunungkidul') || city.toLowerCase().includes('kulon progo')) {
            isJogja = true;
          }
        }

        setAddressForm(prev => ({
          ...prev,
          full_address: `${displayAddress}, ${lat.toFixed(7)}, ${lng.toFixed(7)}`,
          is_jogja: isJogja
        }));
      }
    } catch (err) {
      setAddressForm(prev => ({
        ...prev,
        full_address: `Koordinat: ${lat.toFixed(7)}, ${lng.toFixed(7)}`
      }));
    }
  };

  // Handle Map and Marker initialization
  useEffect(() => {
    if (!leafletLoaded || !mapOpen) return;

    const L = (window as any).L;
    if (!L) return;

    const mapContainer = document.getElementById("address-map");
    if (!mapContainer || (mapContainer as any)._leaflet_id) return; // Prevent double init

    const initialCoords: [number, number] = [customerCoords.lat, customerCoords.lng];

    if (!mapRef.current) {
      mapRef.current = L.map("address-map").setView(initialCoords, 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      markerRef.current = L.marker(initialCoords, {
        draggable: true,
        title: "Geser ke Lokasi Anda"
      }).addTo(mapRef.current).bindPopup("<b>Geser pin ini untuk mendapatkan alamat otomatis.</b>").openPopup();

      markerRef.current.on("dragend", async (e: any) => {
        const position = e.target.getLatLng();
        const newLat = position.lat;
        const newLng = position.lng;
        setCustomerCoords({ lat: newLat, lng: newLng });
        fetchReverseGeocoding(newLat, newLng);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletLoaded, mapOpen]);

  const searchLocation = async () => {
    if (!mapSearchQuery.trim()) return;
    setIsSearchingMap(true);
    try {
      // Prioritaskan hasil pencarian di Indonesia
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&countrycodes=id`);
      const data = await res.json();
      setMapSearchResults(data);
    } catch (err) {
      console.error(err);
    }
    setIsSearchingMap(false);
  };

  const selectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo([lat, lon], 16);
      markerRef.current.setLatLng([lat, lon]);
      
      setCustomerCoords({ lat, lng: lon });
      fetchReverseGeocoding(lat, lon);
    }
    setMapSearchResults([]);
    setMapSearchQuery("");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung fitur lokasi.");
      return;
    }
    
    setIsSearchingMap(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        if (mapRef.current && markerRef.current) {
          mapRef.current.flyTo([lat, lon], 16);
          markerRef.current.setLatLng([lat, lon]);
          
          setCustomerCoords({ lat, lng: lon });
          fetchReverseGeocoding(lat, lon);
        }
        setIsSearchingMap(false);
      },
      (error) => {
        alert("Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses lokasi pada browser.");
        setIsSearchingMap(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const updateData: any = {
      name: profileData.name,
      phone: profileData.phone,
    };
    if (profileData.password) {
      updateData.password = profileData.password;
    }

    const result = await updateUserProfile(updateData);
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      alert("Profil berhasil diperbarui!");
      router.refresh();
    }
    setSaving(false);
  };

  const openAddressModal = (addr?: any) => {
    setMapOpen(false); // Reset map state
    setMapSearchQuery("");
    setMapSearchResults([]);
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        recipient_name: addr.recipient_name,
        phone: addr.phone,
        full_address: addr.full_address,
        is_jogja: addr.is_jogja,
        is_primary: addr.is_primary
      });
      // Try to extract coordinates to set the map
      const match = addr.full_address.match(/(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
      if (match) {
        setCustomerCoords({ lat: parseFloat(match[1]), lng: parseFloat(match[2]) });
      }
    } else {
      setEditingAddress(null);
      setAddressForm({
        recipient_name: profileData.name,
        phone: profileData.phone,
        full_address: '',
        is_jogja: null,
        is_primary: addresses.length === 0
      });
      setCustomerCoords({ lat: -7.7647423, lng: 110.3494548 }); // Reset to Jogja default
    }
    setShowModal(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    let result;
    if (editingAddress) {
      result = await updateAddress(editingAddress.id, addressForm);
    } else {
      result = await addAddress(addressForm);
    }

    if (result.error) {
      alert("Error: " + result.error);
    } else {
      setShowModal(false);
      await loadProfile();
    }
    setSaving(false);
  };

  const handleDeleteAddress = async (id: number) => {
    if (confirm("Yakin ingin menghapus alamat ini?")) {
      const result = await deleteAddress(id);
      if (result.error) {
        alert("Error: " + result.error);
      } else {
        await loadProfile();
      }
    }
  };

  const handleSetPrimary = async (id: number) => {
    const result = await updateAddress(id, { is_primary: true });
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      await loadProfile();
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Memuat profil...</div>;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Link href="/customer/dashboard" style={{ color: "var(--primary)" }}>
          <ChevronLeft />
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--secondary)", fontFamily: "var(--font-serif)" }}>Profil Saya</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 }}>
        
        {/* Left Column: Basic Info */}
        <div className="card" style={{ padding: 24, height: "fit-content" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--secondary)", marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>Data Pribadi</h2>
          <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--secondary)", marginBottom: 8 }}>
                <User size={16} /> Nama Lengkap
              </label>
              <input 
                type="text" 
                required
                value={profileData.name}
                onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontSize: 14 }}
              />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--secondary)", marginBottom: 8 }}>
                <Phone size={16} /> Nomor HP (WhatsApp)
              </label>
              <input 
                type="text" 
                required
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontSize: 14 }}
              />
            </div>

            <div style={{ padding: 16, backgroundColor: "#f9fafb", borderRadius: 12, border: "1px solid #e5e7eb" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--secondary)", marginBottom: 8 }}>
                <Lock size={16} /> Ganti Password (Opsional)
              </label>
              <input 
                type="password" 
                value={profileData.password}
                onChange={(e) => setProfileData({...profileData, password: e.target.value})}
                placeholder="Kosongkan jika tidak ganti"
                style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border)", outline: "none", fontSize: 14 }}
              />
            </div>

            <button 
              type="submit" 
              disabled={saving}
              style={{ 
                marginTop: 8, padding: "14px", borderRadius: 12, border: "none", 
                backgroundColor: "var(--primary)", color: "white", fontSize: 15, fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 
              }}
            >
              {saving ? "Menyimpan..." : "Simpan Profil"}
            </button>
          </form>
        </div>

        {/* Right Column: Addresses */}
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--secondary)" }}>Daftar Alamat</h2>
            <button 
              onClick={() => openAddressModal()}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "white", backgroundColor: "var(--primary)", padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer" }}
            >
              <Plus size={14} /> Tambah Alamat
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            {addresses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
                <MapPin size={32} style={{ margin: "0 auto 12px auto", opacity: 0.5 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>Belum ada alamat tersimpan.</p>
                <p style={{ fontSize: 12 }}>Tambahkan alamat untuk mempermudah proses checkout.</p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div key={addr.id} style={{ padding: 16, borderRadius: 12, border: addr.is_primary ? "2px solid var(--primary)" : "1px solid #e5e7eb", backgroundColor: addr.is_primary ? "#fff1f2" : "white", position: "relative" }}>
                  {addr.is_primary && (
                    <span style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: "var(--primary)", backgroundColor: "#fce7f3", padding: "4px 8px", borderRadius: 6 }}>
                      <Star size={12} fill="currentColor" /> Alamat Utama
                    </span>
                  )}
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--secondary)", marginBottom: 4, paddingRight: addr.is_primary ? 100 : 0 }}>
                    {addr.recipient_name}
                  </h3>
                  <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 8 }}>{addr.phone}</p>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5, marginBottom: 12 }}>{addr.full_address}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 8px", borderRadius: 4, backgroundColor: addr.is_jogja ? "#ecfdf5" : "#f3f4f6", color: addr.is_jogja ? "#059669" : "#6b7280" }}>
                      {addr.is_jogja ? "Wilayah DI Yogyakarta" : "Luar DI Yogyakarta"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 12, borderTop: "1px dashed var(--border)", paddingTop: 12 }}>
                    {!addr.is_primary && (
                      <button onClick={() => handleSetPrimary(addr.id)} style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                        Jadikan Utama
                      </button>
                    )}
                    <button onClick={() => openAddressModal(addr)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#4b5563", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => handleDeleteAddress(addr.id)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                      <Trash2 size={14} /> Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="card" style={{ padding: 24, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--secondary)", marginBottom: 20 }}>
              {editingAddress ? "Edit Alamat" : "Tambah Alamat Baru"}
            </h2>
            <form onSubmit={handleAddressSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 6, display: "block" }}>Nama Penerima</label>
                <input 
                  type="text" 
                  required
                  value={addressForm.recipient_name}
                  onChange={(e) => setAddressForm({...addressForm, recipient_name: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", outline: "none", fontSize: 14 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 6, display: "block" }}>Nomor HP Penerima</label>
                <input 
                  type="text" 
                  required
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", outline: "none", fontSize: 14 }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#4b5563", display: "block" }}>Alamat Lengkap</label>
                  <button
                    type="button"
                    onClick={() => setMapOpen(!mapOpen)}
                    style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Map size={14} /> {mapOpen ? "Tutup Peta" : "Pilih dari Peta Otomatis"}
                  </button>
                </div>

                {mapOpen && (
                  <div style={{ marginBottom: 12, backgroundColor: "#f9fafb", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
                    {/* Search Field for Map */}
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input 
                        type="text"
                        placeholder="Cari jalan, desa, atau kecamatan..."
                        value={mapSearchQuery}
                        onChange={(e) => setMapSearchQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchLocation(); } }}
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 13 }}
                      />
                      <button 
                        type="button" 
                        onClick={searchLocation}
                        disabled={isSearchingMap}
                        style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: isSearchingMap ? "not-allowed" : "pointer", opacity: isSearchingMap ? 0.7 : 1 }}
                      >
                        <Search size={14} /> Cari
                      </button>
                    </div>

                    <div style={{ marginBottom: 12, textAlign: "right" }}>
                      <button 
                        type="button"
                        onClick={useCurrentLocation}
                        disabled={isSearchingMap}
                        style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 12px", backgroundColor: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: isSearchingMap ? "not-allowed" : "pointer" }}
                      >
                        <Navigation size={12} /> Gunakan Lokasi Saat Ini
                      </button>
                    </div>

                    {/* Search Results Dropdown */}
                    {mapSearchResults.length > 0 && (
                      <div style={{ backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: 6, maxHeight: 150, overflowY: "auto", marginBottom: 12, boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                        {mapSearchResults.map((res: any, idx: number) => (
                          <div 
                            key={idx} 
                            onClick={() => selectSearchResult(res)}
                            style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 8 }}
                          >
                            <MapPin size={14} style={{ color: "#9ca3af", flexShrink: 0, marginTop: 2 }} />
                            <span>{res.display_name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      id="address-map"
                      style={{ width: "100%", height: 200, borderRadius: 8, border: "1px solid #d1d5db", position: "relative", zIndex: 1 }}
                    >
                      {!leafletLoaded && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(249,250,251,0.8)", fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>
                          🔄 Memuat peta interaktif...
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>
                      👉 Cari lokasi atau geser pin ke lokasi Anda untuk mendeteksi alamat dan wilayah.
                    </p>
                  </div>
                )}

                <textarea 
                  required
                  value={addressForm.full_address}
                  onChange={(e) => setAddressForm({...addressForm, full_address: e.target.value})}
                  rows={3}
                  placeholder="Ketik manual atau gunakan Pilih dari Peta di atas..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", outline: "none", fontSize: 14, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px", backgroundColor: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: "#4b5563" }}>Wilayah Pengiriman *</label>
                <p style={{ fontSize: 11, color: "#9ca3af", margin: 0, lineHeight: 1.4 }}>Pilih wilayah secara manual, atau biarkan Peta mendeteksinya secara otomatis.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4b5563", cursor: "pointer", fontWeight: 600 }}>
                    <input 
                      type="radio" 
                      name="is_jogja"
                      checked={addressForm.is_jogja === true}
                      onChange={() => setAddressForm({...addressForm, is_jogja: true})}
                      style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
                    />
                    DI Yogyakarta
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#4b5563", cursor: "pointer", fontWeight: 600 }}>
                    <input 
                      type="radio" 
                      name="is_jogja"
                      checked={addressForm.is_jogja === false}
                      onChange={() => setAddressForm({...addressForm, is_jogja: false})}
                      style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
                    />
                    Luar DI Yogyakarta
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input 
                  type="checkbox" 
                  id="is_primary"
                  checked={addressForm.is_primary}
                  disabled={addresses.length === 0}
                  onChange={(e) => setAddressForm({...addressForm, is_primary: e.target.checked})}
                  style={{ width: 16, height: 16, accentColor: "var(--primary)" }}
                />
                <label htmlFor="is_primary" style={{ fontSize: 13, fontWeight: 600, color: "#4b5563", cursor: addresses.length === 0 ? "not-allowed" : "pointer" }}>
                  Jadikan sebagai alamat utama
                </label>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "white", color: "#4b5563", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={saving || addressForm.is_jogja === null}
                  style={{ flex: 1, padding: "12px", borderRadius: 8, border: "none", backgroundColor: "var(--primary)", color: "white", fontSize: 14, fontWeight: 700, cursor: (saving || addressForm.is_jogja === null) ? "not-allowed" : "pointer", opacity: (saving || addressForm.is_jogja === null) ? 0.7 : 1 }}
                >
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
