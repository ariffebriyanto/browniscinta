"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ShoppingBag,
  Calendar,
  CreditCard,
  UploadCloud,
  Printer,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  LogOut,
  X,
  ShoppingCart,
  TimerOff,
} from "lucide-react";
import { uploadPaymentProof, confirmDelivery, cancelOrder, submitRefundAccount } from "./actions";

interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    image_url: string | null;
  };
}

interface Order {
  id: string;
  createdAt: string;
  total_price: number;
  status: string;
  shipping_cost: number;
  shipping_service: string | null;
  shipping_resi: string | null;
  payment_proof: string | null;
  payment_deadline: string | null;
  items: OrderItem[];
}

function useCountdown(deadline: string | null): { mm: string; ss: string; expired: boolean } | null {
  const calc = useCallback(() => {
    if (!deadline) return { mm: '00', ss: '00', expired: true };
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { mm: '00', ss: '00', expired: true };
    const totalSec = Math.floor(diff / 1000);
    const mm = String(Math.floor(totalSec / 60));
    const ss = String(totalSec % 60).padStart(2, '0');
    return { mm, ss, expired: false };
  }, [deadline]);

  // Start with null to prevent Hydration Mismatch on Date.now()
  const [state, setState] = useState<{ mm: string; ss: string; expired: boolean } | null>(null);

  useEffect(() => {
    if (!deadline) return;
    setState(calc());
    const interval = setInterval(() => setState(calc()), 1000);
    return () => clearInterval(interval);
  }, [deadline, calc]);

  return state;
}

function CountdownBanner({ order, onExpired }: { order: Order; onExpired: (id: string) => void }) {
  const state = useCountdown(order.payment_deadline);

  useEffect(() => {
    if (state?.expired) onExpired(order.id);
  }, [state?.expired, order.id, onExpired]);

  if (!order.payment_deadline || !state) return null;

  const { mm, ss, expired } = state;

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12,
      padding: "12px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700,
      backgroundColor: expired ? "#fff1f2" : "#fffbeb",
      border: `1px solid ${expired ? "#fecdd3" : "#fde68a"}`,
      color: expired ? "#e11d48" : "#b45309"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {expired ? <TimerOff size={16} /> : <Clock size={16} />}
        {expired ? (
          <span>Waktu pembayaran habis — pesanan otomatis dibatalkan.</span>
        ) : (
          <span>
            Selesaikan pembayaran dalam{' '}
            <span style={{ fontFamily: "monospace", fontSize: 18, letterSpacing: 1 }}>{mm} menit {ss} detik</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default function CustomerDashboardClient({
  userName,
  orders: initialOrders
}: {
  userName: string;
  orders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeInvoice, setActiveInvoice] = useState<Order | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  // Upload State
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Delivery Confirm State
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // Refund State
  const [refundAccount, setRefundAccount] = useState<Record<string, string>>({});
  const [refundLoadingId, setRefundLoadingId] = useState<string | null>(null);

  // Auto-cancel handler (called by CountdownBanner when timer hits 0)
  const handleExpired = useCallback(async (orderId: string) => {
    await cancelOrder(orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
  }, []);

  // Stats
  const totalSpend = orders
    .filter(o => o.status !== "CANCELLED" && o.status !== "PENDING")
    .reduce((sum, o) => sum + o.total_price, 0);
  const pendingCount = orders.filter(o => o.status === "PENDING").length;
  const processCount = orders.filter(o => o.status === "PAID" || o.status === "APPROVED").length;
  const actionNeededCount = orders.filter(o => o.status === "REFUND_REQUESTED" || o.status === "SHIPPED").length;

  const filteredOrders = orders.filter(o => {
    if (filter === "ALL") return true;
    if (filter === "PENDING") return o.status === "PENDING";
    if (filter === "PROCESS") return o.status === "PAID" || o.status === "APPROVED";
    if (filter === "ACTION") return o.status === "REFUND_REQUESTED" || o.status === "SHIPPED";
    return true;
  });

  const handleDrag = (e: React.DragEvent, id?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      if (id) setDragActiveId(id);
    } else if (e.type === "dragleave") {
      setDragActiveId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveId(null);
    setUploadError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Hanya file gambar (.jpg, .png, .webp) yang diperbolehkan.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal adalah 2MB.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUploadSubmit = async (orderId: string) => {
    if (!selectedFile) {
      setUploadError("Silakan pilih file bukti transfer terlebih dahulu.");
      return;
    }

    setUploadingId(orderId);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const result = await uploadPaymentProof(orderId, formData);

    setUploadingId(null);

    if (result.error) {
      setUploadError(result.error);
    } else if (result.success && result.paymentProofUrl) {
      setOrders(orders.map(o => 
        o.id === orderId 
          ? { ...o, status: "PAID", payment_proof: result.paymentProofUrl || null } 
          : o
      ));
      setSelectedFile(null);
      setPreviewUrl(null);
      alert("Bukti transfer berhasil diunggah! Status pesanan Anda diperbarui.");
    }
  };

  const handleConfirmDelivery = async (order: any) => {
    // Menghapus window.confirm karena sering diblokir oleh browser (menyebabkan "tidak terjadi apa-apa")
    setConfirmingId(order.id);
    const result = await confirmDelivery(order.id);
    setConfirmingId(null);

    if (result.error) {
      alert(result.error);
    } else {
      setOrders(orders.map(o => 
        o.id === order.id ? { ...o, status: "COMPLETED" } : o
      ));
      alert("Pesanan selesai! Terima kasih telah berbelanja di Brownis Cinta.");
    }
  };

  const handleRefundSubmit = async (orderId: string) => {
    const account = refundAccount[orderId];
    if (!account || account.trim().length < 5) {
      alert("Mohon masukkan informasi Bank dan Nomor Rekening dengan lengkap.");
      return;
    }
    
    setRefundLoadingId(orderId);
    const result = await submitRefundAccount(orderId, account);
    setRefundLoadingId(null);

    if (result.error) {
      alert(result.error);
    } else {
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: "REFUND_PENDING", refund_account: account } : o
      ));
      alert("Informasi rekening berhasil disimpan. Dana akan segera dikembalikan oleh toko.");
    }
  };

  const getStatusText = (order: any) => {
    switch (order.status) {
      case "PENDING": return "Menunggu Pembayaran";
      case "PAID": return "Menunggu Konfirmasi Penjual";
      case "APPROVED": return "Pesanan Sedang Disiapkan";
      case "SHIPPED": return order.shipping_service?.includes("Ambil") ? "Siap Diambil di Toko" : "Sedang Dikirim Kurir";
      case "COMPLETED": return "Selesai";
      case "CANCELLED": return "Dibatalkan";
      case "REFUND_REQUESTED": return "Menunggu Input Rekening Refund";
      case "REFUND_PENDING": return "Refund Diproses";
      case "REFUND_COMPLETED": return "Refund Selesai";
      default: return order.status;
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "PENDING": return { backgroundColor: "#fffbeb", color: "#d97706", borderColor: "#fde68a" };
      case "PAID": return { backgroundColor: "#eff6ff", color: "#2563eb", borderColor: "#bfdbfe" };
      case "APPROVED": return { backgroundColor: "#f5f3ff", color: "#7c3aed", borderColor: "#ddd6fe" };
      case "SHIPPED": return { backgroundColor: "#faf5ff", color: "#9333ea", borderColor: "#e9d5ff" };
      case "COMPLETED": return { backgroundColor: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" };
      case "CANCELLED": return { backgroundColor: "#fef2f2", color: "#dc2626", borderColor: "#fecaca" };
      case "REFUND_REQUESTED": return { backgroundColor: "#fff1f2", color: "#e11d48", borderColor: "#fecdd3" };
      case "REFUND_PENDING": return { backgroundColor: "#fefce8", color: "#ca8a04", borderColor: "#fef08a" };
      case "REFUND_COMPLETED": return { backgroundColor: "#f0fdf4", color: "#16a34a", borderColor: "#bbf7d0" };
      default: return { backgroundColor: "#f3f4f6", color: "#4b5563", borderColor: "#d1d5db" };
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      
      {/* Printable Invoice Override Style */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-modal-content, #invoice-modal-content * { visibility: visible; }
          #invoice-modal-content {
            position: absolute; left: 0; top: 0; width: 100%;
            border: none !important; box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header Navigation */}
      <nav
        className="no-print"
        style={{
          position: "sticky", top: 0, zIndex: 40,
          backgroundColor: "rgba(255,255,255,0.95)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(8px)",
          boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 14 }}>
          <Link href="/" style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--primary)", fontSize: 18, textDecoration: "none" }}>
            Brownis Cinta
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--secondary)", fontWeight: 600 }}>Halo, {userName}</span>
            <button 
              onClick={() => signOut({ callbackUrl: "/login" })} 
              style={{
                border: "1.5px solid var(--primary)", color: "var(--primary)",
                background: "transparent", padding: "7px 14px", borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="no-print" style={{ flex: 1 }}>
        <div className="container" style={{ paddingTop: 32, paddingBottom: 40 }}>
        
        {/* Page Hero */}
        <div style={{ marginBottom: 28, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", color: "var(--secondary)", fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Dashboard Customer</h1>
            <p style={{ fontSize: 13, color: "var(--text-light)" }}>Kelola pesanan, riwayat pembayaran, dan bukti transfer Anda di sini.</p>
          </div>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20Brownis%20Cinta,%20saya%20butuh%20bantuan%20terkait%20pesanan%20saya."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: "#25D366", color: "white", padding: "10px 18px", borderRadius: 12,
              fontSize: 13, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, textDecoration: "none",
              boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)", transition: "all 0.2s"
            }}
          >
            💬 Chat Bantuan Admin
          </a>
        </div>

        {/* Stats Overview */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { id: "ALL", icon: "🛍", label: "Semua Pesanan", value: `Rp ${totalSpend.toLocaleString("id-ID")}`, bg: "#fff1f2", notif: 0 },
            { id: "PENDING", icon: "⏳", label: "Belum Bayar", value: `${pendingCount} Pesanan`, bg: "#fffbeb", notif: pendingCount },
            { id: "PROCESS", icon: "⚙️", label: "Diproses", value: `${processCount} Pesanan`, bg: "#eff6ff", notif: 0 },
            { id: "ACTION", icon: "⚠️", label: "Perlu Tindakan", value: `${actionNeededCount} Pesanan`, bg: "#fef2f2", notif: actionNeededCount, borderColor: actionNeededCount > 0 ? "#fecaca" : "#f3f4f6" },
          ].map((stat, i) => (
            <div 
              key={stat.label} 
              onClick={() => setFilter(stat.id)}
              style={{
                backgroundColor: filter === stat.id ? "#fff1f2" : "white",
                borderRadius: 14, border: `2px solid ${filter === stat.id ? "var(--primary)" : (stat.borderColor || "#f3f4f6")}`,
                boxShadow: filter === stat.id ? "0 4px 12px rgba(190, 18, 60, 0.1)" : "0 2px 8px rgba(0,0,0,0.04)",
                padding: "16px 18px",
                display: "flex", alignItems: "center", gap: 14,
                cursor: "pointer", position: "relative",
                transition: "all 0.2s"
              }}>
              {stat.notif > 0 && (
                <div style={{ position: "absolute", top: -8, right: -8, backgroundColor: "#e11d48", color: "white", fontSize: 10, fontWeight: 800, padding: "4px 8px", borderRadius: 12, boxShadow: "0 2px 4px rgba(225, 29, 72, 0.3)" }}>
                  {stat.notif} Notif
                </div>
              )}
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: stat.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>{stat.icon}</div>
              <div>
                <p style={{ fontSize: 11, color: filter === stat.id ? "var(--primary)" : "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>{stat.label}</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Transactions/Orders */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--secondary)", fontSize: 18, fontWeight: 700 }}>Riwayat Transaksi Anda</h2>
          {filter !== "ALL" && (
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", backgroundColor: "#fff1f2", padding: "4px 12px", borderRadius: 20 }}>
              Menampilkan: {filter === "PENDING" ? "Belum Bayar" : filter === "PROCESS" ? "Diproses" : "Perlu Tindakan"}
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {filteredOrders.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", backgroundColor: "white", borderRadius: 16, border: "1px dashed #d1d5db" }}>
              <p style={{ fontSize: 14, color: "#6b7280", fontWeight: 600 }}>Tidak ada pesanan di kategori ini.</p>
            </div>
          ) : filteredOrders.map((order) => {
            const isPending = order.status === "PENDING";
            return (
              <div 
                key={order.id} 
                className="card"
                style={{ 
                  border: isPending ? "2px solid #fde68a" : "1px solid var(--border)",
                  boxShadow: isPending ? "0 0 0 4px rgba(245,158,11,0.05)" : "var(--shadow-sm)"
                }}
              >
                
                {/* Order Card Header */}
                <div style={{ backgroundColor: "#f9fafb", padding: "16px 24px", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>ID TRANSAKSI</p>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", fontFamily: "monospace", marginTop: 2 }}>#{order.id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                    <span suppressHydrationWarning style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={14} /> {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span style={{ 
                      padding: "4px 12px", borderRadius: 50, fontSize: 11, fontWeight: 700, border: "1px solid",
                      ...getStatusBadgeStyle(order.status)
                    }}>
                      {getStatusText(order)}
                    </span>
                  </div>
                </div>

                {/* Countdown banner for PENDING orders */}
                {isPending && order.payment_deadline && (
                  <div style={{ padding: "16px 24px 0 24px" }}>
                    <CountdownBanner order={order} onExpired={handleExpired} />
                  </div>
                )}

                {/* Items & Shipping */}
                <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr", gap: 32 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
                    
                    {/* Left: Items list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: 0.5 }}>Detail Produk</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {order.items.map((item) => (
                          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <div style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", backgroundColor: "#f9fafb", flexShrink: 0 }}>
                                <img 
                                  src={item.product.image_url || `/${item.product.name.toLowerCase().includes('lumer') ? 'dessert_lumer' : item.product.name.toLowerCase().includes('roti') ? 'roti_ring' : 'hero_bg'}.png`}
                                  alt={item.product.name} 
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              </div>
                              <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{item.product.name}</h4>
                                <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{item.quantity} x Rp {item.price.toLocaleString("id-ID")}</p>
                              </div>
                            </div>
                            <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>
                              Rp {(item.price * item.quantity).toLocaleString("id-ID")}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          {order.shipping_service && (
                            <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
                              Pengiriman: <span style={{ color: "#4b5563", fontWeight: 700, textTransform: "uppercase" }}>{order.shipping_service}</span>
                            </p>
                          )}
                          {order.shipping_resi && (
                            <p style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600, marginTop: 4, fontFamily: "monospace" }}>
                              No. Resi: <span style={{ color: "var(--secondary)", fontWeight: 700 }}>{order.shipping_resi}</span>
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>Total Pembayaran</span>
                          <span style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)", display: "block", marginTop: 4 }}>
                            Rp {order.total_price.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Payment Instructions or Proof Uploader */}
                    <div style={{ backgroundColor: "#f9fafb", padding: 20, borderRadius: 16, border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 200 }}>
                      {isPending ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div>
                            <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--secondary)", textTransform: "uppercase", letterSpacing: 0.5, display: "flex", alignItems: "center", gap: 6 }}>
                              <CreditCard size={14} color="var(--primary)" /> Instruksi Pembayaran
                            </h4>
                            <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginTop: 4 }}>
                              Kirim persis <span style={{ color: "var(--primary)", fontWeight: 700 }}>Rp {order.total_price.toLocaleString("id-ID")}</span> ke rekening BCA admin:
                            </p>
                          </div>
                          <div style={{ backgroundColor: "white", padding: 14, borderRadius: 12, border: "1px solid #fecdd3", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                            <p style={{ fontWeight: 700, color: "var(--primary)", fontSize: 20, fontFamily: "monospace" }}>BCA 2140639403</p>
                            <p style={{ color: "var(--secondary)", fontSize: 12, fontWeight: 700, marginTop: 2 }}>a/n Arif Febriyanto</p>
                          </div>

                          {/* Upload Trigger / Dropzone */}
                          <div style={{ paddingTop: 8 }}>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Upload Bukti Transfer</label>
                            <div 
                              style={{ 
                                border: `2px dashed ${dragActiveId === order.id ? "var(--primary)" : "#e5e7eb"}`,
                                backgroundColor: dragActiveId === order.id ? "#fff1f2" : "transparent",
                                borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer", transition: "all 0.2s"
                              }}
                              onDragEnter={(e) => handleDrag(e, order.id)}
                              onDragOver={(e) => handleDrag(e, order.id)}
                              onDragLeave={(e) => handleDrag(e)}
                              onDrop={(e) => handleDrop(e, order.id)}
                              onClick={() => document.getElementById(`file-input-${order.id}`)?.click()}
                            >
                              <input 
                                type="file" 
                                id={`file-input-${order.id}`} 
                                style={{ display: "none" }} 
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                              {previewUrl && selectedFile ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                  <img src={previewUrl} style={{ height: 64, objectFit: "contain", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} alt="Preview Proof" />
                                  <span style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFile.name}</span>
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, color: "#9ca3af" }}>
                                  <UploadCloud size={24} />
                                  <span style={{ fontSize: 11, fontWeight: 700 }}>Tarik file ke sini atau klik untuk memilih</span>
                                  <span style={{ fontSize: 9, fontWeight: 600, color: "#d1d5db" }}>Format: PNG, JPG, WEBP (Max. 2MB)</span>
                                </div>
                              )}
                            </div>

                            {uploadError && (
                              <p style={{ fontSize: 10, color: "#ef4444", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                                <AlertCircle size={12} /> {uploadError}
                              </p>
                            )}

                            {previewUrl && selectedFile && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUploadSubmit(order.id);
                                }}
                                disabled={uploadingId === order.id}
                                className="btn-primary"
                                style={{ width: "100%", padding: "10px", borderRadius: 12, fontSize: 12, marginTop: 12 }}
                              >
                                {uploadingId === order.id ? "Mengunggah..." : "Kirim Bukti Pembayaran"}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", gap: 16 }}>
                          <div>
                            <h4 style={{ fontSize: 12, fontWeight: 700, color: "var(--secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Status Pembayaran</h4>
                            {order.payment_proof ? (
                              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, backgroundColor: "#ecfdf5", color: "#047857", padding: "8px 12px", borderRadius: 8, border: "1px solid #a7f3d0" }}>
                                <CheckCircle size={16} />
                                <span style={{ fontSize: 11, fontWeight: 700 }}>Bukti Pembayaran Terkirim</span>
                              </div>
                            ) : (
                              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8, fontWeight: 600 }}>Pembayaran diselesaikan secara offline / dikonfirmasi admin.</p>
                            )}
                          </div>

                          {/* View uploaded proof if available */}
                          {order.payment_proof && (
                            <a 
                              href={order.payment_proof} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}
                            >
                              👁️ Lihat Bukti Transfer Anda
                            </a>
                          )}

                          {/* Confirm Shipped Delivery / Pickup */}
                          {order.status === "SHIPPED" && (
                            <div style={{ paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
                              <p style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>
                                {order.shipping_service?.includes("Ambil") 
                                  ? "Pesanan Anda sudah siap. Silakan datang ke toko untuk mengambilnya."
                                  : "Pesanan Anda sedang dikirim oleh kurir. Silakan konfirmasi jika barang sudah sampai."}
                              </p>
                              <button
                                onClick={() => handleConfirmDelivery(order)}
                                disabled={confirmingId === order.id}
                                className="btn-primary"
                                style={{ width: "100%", padding: "10px", borderRadius: 12, fontSize: 12 }}
                              >
                                {confirmingId === order.id 
                                  ? "Memproses..." 
                                  : (order.shipping_service?.includes("Ambil") ? "Pesanan Sudah Saya Ambil" : "Pesanan Telah Diterima")}
                              </button>
                            </div>
                          )}

                          {/* Refund Handling */}
                          {order.status === "REFUND_REQUESTED" && (
                            <div style={{ paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
                              <div style={{ padding: "12px", backgroundColor: "#fff1f2", borderRadius: 12, border: "1px solid #fecdd3", marginBottom: 12 }}>
                                <p style={{ fontSize: 11, color: "#be123c", fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>
                                  ⚠️ Stok pesanan ini sedang kosong (Refund Diterima).
                                </p>
                                <p style={{ fontSize: 10, color: "#9f1239", lineHeight: 1.4 }}>
                                  Silakan isi informasi Bank / E-Wallet dan Nomor Rekening Anda agar kami dapat segera mengembalikan dana Anda sepenuhnya.
                                </p>
                              </div>
                              <input 
                                type="text"
                                placeholder="Contoh: BCA - 12345678 a.n. Budi"
                                value={refundAccount[order.id] || ""}
                                onChange={(e) => setRefundAccount({ ...refundAccount, [order.id]: e.target.value })}
                                style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none", marginBottom: 8, boxSizing: "border-box" }}
                              />
                              <button
                                onClick={() => handleRefundSubmit(order.id)}
                                disabled={refundLoadingId === order.id}
                                className="btn-primary"
                                style={{ width: "100%", padding: "10px", borderRadius: 12, fontSize: 12, backgroundColor: "#e11d48" }}
                              >
                                {refundLoadingId === order.id ? "Menyimpan..." : "Simpan Rekening Refund"}
                              </button>
                            </div>
                          )}

                          {order.status === "REFUND_PENDING" && (
                            <div style={{ paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
                              <p style={{ fontSize: 11, color: "#854d0e", fontWeight: 600, lineHeight: 1.4, padding: "8px 12px", backgroundColor: "#fefce8", borderRadius: 8, border: "1px solid #fef08a" }}>
                                ⏳ Rekening Refund Anda: <strong style={{ color: "#713f12" }}>{order.refund_account}</strong><br/>
                                Admin akan segera memproses pengembalian dana Anda.
                              </p>
                            </div>
                          )}

                          {order.status === "REFUND_COMPLETED" && (
                            <div style={{ paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
                              <p style={{ fontSize: 11, color: "#047857", fontWeight: 700, padding: "8px 12px", backgroundColor: "#ecfdf5", borderRadius: 8, border: "1px solid #a7f3d0" }}>
                                ✅ Dana telah berhasil dikembalikan ke rekening Anda.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bottom Invoice Button */}
                      <button
                        onClick={() => setActiveInvoice(order)}
                        className="btn-secondary"
                        style={{ width: "100%", padding: "8px", borderRadius: 12, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 16 }}
                      >
                        <Printer size={13} /> Detail & Cetak Invoice
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}

          {orders.length === 0 && (
            <div style={{ backgroundColor: "white", padding: 48, textAlign: "center", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
              <ShoppingBag size={40} color="#d1d5db" style={{ margin: "0 auto 16px auto" }} />
              <p style={{ color: "#9ca3af", fontWeight: 700, fontSize: 14 }}>Belum Ada Transaksi</p>
              <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 4, maxWidth: 320, margin: "4px auto 0 auto" }}>Anda belum pernah melakukan pemesanan kue. Silakan pilih menu terlaris kami di halaman utama.</p>
              <Link href="/" className="btn-primary" style={{ display: "inline-flex", padding: "10px 20px", borderRadius: 12, fontSize: 12, marginTop: 16, textDecoration: "none" }}>Pesan Sekarang</Link>
            </div>
          )}
        </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="no-print" style={{ backgroundColor: "var(--secondary)", color: "white" }}>
        <div className="container" style={{ paddingTop: 28, paddingBottom: 28, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>© 2026 Brownis Cinta Official. All rights reserved.</p>
        </div>
      </footer>

      {/* Invoice Modal Overlay */}
      {activeInvoice && (
        <div className="invoice-overlay" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.5)", overflowY: "auto" }}>
          <div id="invoice-modal-content" style={{ position: "relative", backgroundColor: "white", borderRadius: 16, boxShadow: "0 20px 40px rgba(0,0,0,0.2)", border: "1px solid var(--border)", maxWidth: 672, width: "100%", padding: 32, display: "flex", flexDirection: "column", gap: 24, maxHeight: "90vh", overflowY: "auto" }}>
            
            {/* Modal Header Controls */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 18, color: "var(--secondary)" }}>Nota Pesanan / Invoice</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button 
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{ padding: "8px 16px", borderRadius: 12, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Printer size={13} /> Cetak
                </button>
                <button 
                  onClick={() => {
                    setActiveInvoice(null);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  style={{ padding: 8, color: "#9ca3af", borderRadius: 8, cursor: "pointer", background: "transparent", border: "none" }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Print Header (Only visible on paper print) */}
            <div className="print-only-flex" style={{ display: "none", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #111827", paddingBottom: 16, marginBottom: 16 }}>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-serif)", color: "#1f2937", margin: 0 }}>BROWNIS CINTA</h1>
                <p style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, margin: 0 }}>Official Invoice · Roti, Dessert & Brownies Premium</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", margin: 0 }}>STATUS TRANSAKSI</p>
                <p style={{ fontSize: 14, fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", marginTop: 4, margin: 0 }}>{getStatusText(activeInvoice)}</p>
              </div>
            </div>

            {/* Invoice Contents */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Ditagihkan Kepada</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--secondary)", marginTop: 4 }}>{userName}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Detail Invoice</p>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1f2937", fontFamily: "monospace", marginTop: 4 }}>Invoice ID: #{activeInvoice.id.slice(-12).toUpperCase()}</p>
                  <p suppressHydrationWarning style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginTop: 2 }}>Tanggal: {new Date(activeInvoice.createdAt).toLocaleDateString("id-ID")}</p>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb", color: "#6b7280", fontWeight: 700, borderBottom: "1px solid var(--border)" }}>
                      <th style={{ padding: 12 }}>Nama Menu</th>
                      <th style={{ padding: 12, textAlign: "center" }}>Jumlah</th>
                      <th style={{ padding: 12, textAlign: "right" }}>Harga Satuan</th>
                      <th style={{ padding: 12, textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: "#374151" }}>
                    {activeInvoice.items.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: 12, fontWeight: 700 }}>{item.product.name}</td>
                        <td style={{ padding: 12, textAlign: "center", fontFamily: "monospace", fontWeight: 700 }}>{item.quantity}</td>
                        <td style={{ padding: 12, textAlign: "right", fontFamily: "monospace" }}>Rp {item.price.toLocaleString("id-ID")}</td>
                        <td style={{ padding: 12, textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>Rp {(item.price * item.quantity).toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subtotal & Totals Box */}
              <div style={{ display: "flex", justifyItems: "flex-end", justifyContent: "flex-end", paddingTop: 8 }}>
                <div style={{ width: "100%", maxWidth: 256, display: "flex", flexDirection: "column", gap: 8, borderTop: "1px dashed #e5e7eb", paddingTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280" }}>
                    <span style={{ fontWeight: 600 }}>Subtotal</span>
                    <span style={{ fontWeight: 700, color: "var(--secondary)", fontFamily: "monospace" }}>
                      Rp {activeInvoice.items.reduce((sum, i) => sum + (i.price * i.quantity), 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6b7280", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>Ongkos Kirim</span>
                    <span style={{ fontWeight: 700, color: "var(--secondary)", fontFamily: "monospace" }}>
                      {activeInvoice.shipping_cost > 0 ? `Rp ${activeInvoice.shipping_cost.toLocaleString("id-ID")}` : "Rp 0"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 6 }}>
                    <span style={{ fontWeight: 700, color: "var(--secondary)", fontSize: 14 }}>Total Tagihan</span>
                    <span style={{ fontWeight: 700, color: "var(--primary)", fontSize: 18, fontFamily: "monospace" }}>
                      Rp {activeInvoice.total_price.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Notice */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, fontSize: 10, color: "#9ca3af", fontWeight: 600, textAlign: "center", lineHeight: 1.5 }}>
                <p>Terima kasih telah mempercayakan sajian kebahagiaan Anda kepada Brownis Cinta Bakery.</p>
                <p style={{ marginTop: 2 }}>Yogyakarta, Indonesia · Hubungi WhatsApp Admin untuk bantuan pelayanan.</p>
              </div>

            </div>

            {/* Print Footer Notice (Hidden on screen) */}
            <div className="print-only-block" style={{ display: "none", fontSize: 9, textAlign: "center", color: "#d1d5db", fontWeight: 600, paddingTop: 32, marginTop: 48, borderTop: "1px solid var(--border)", lineHeight: 1 }}>
              Bukti pembelian resmi dari platform E-Commerce Brownis Cinta. Dicetak otomatis oleh customer.
            </div>

            {/* Print specific CSS override */}
            <style>{`
              @media print {
                body {
                  margin: 0;
                  padding: 0;
                  background: white;
                }
                body > div:first-child {
                  display: none; /* Hides the Next.js root layout */
                }
                .invoice-overlay {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  display: block !important;
                }
                #invoice-modal-content {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  max-height: none !important;
                  margin: 0 !important;
                  padding: 20px !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                .no-print { display: none !important; }
                .print-only-flex { display: flex !important; }
                .print-only-block { display: block !important; }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
