"use client";

import { useState, useEffect } from "react";
import { updateOrderStatus, confirmStock, autoCancelAwaitingOrders } from "./actions";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig: Record<string, { label: string; bg: string; color: string; border: string }> = {
  AWAITING:  { label: "🕐 Menunggu Stok", bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  PENDING:   { label: "⏳ Pending",   bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  PAID:      { label: "💵 Paid",      bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  APPROVED:  { label: "✅ Approved",  bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  SHIPPED:   { label: "🚚 Shipped",   bg: "#faf5ff", color: "#7c3aed", border: "#e9d5ff" },
  COMPLETED: { label: "🎉 Completed", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  CANCELLED: { label: "❌ Cancelled", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
  REFUND_REQUESTED: { label: "⚠️ Refund", bg: "#fff1f2", color: "#e11d48", border: "#fecdd3" },
  REFUND_PENDING:   { label: "⏳ Refund Proses", bg: "#fefce8", color: "#ca8a04", border: "#fef08a" },
  REFUND_COMPLETED: { label: "✅ Refund Selesai", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
};

const s = {
  input: {
    padding: "8px 12px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 13,
    fontFamily: "var(--font-sans)",
    outline: "none",
    backgroundColor: "white",
    color: "#111827",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
};

export default function OrderClient({ orders }: { orders: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [resiInputs, setResiInputs] = useState<Record<string, string>>({});

  // Auto-cancel expired AWAITING orders on mount
  useEffect(() => {
    autoCancelAwaitingOrders();
  }, []);

  // Filters State
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const [filterDate, setFilterDate] = useState<string>(todayStr); // Default today
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("NEWEST");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Stats calculation (All time)
  const statAll = orders.length;
  const statAwaiting = orders.filter(o => o.status === "AWAITING").length;
  const statPending = orders.filter(o => o.status === "PENDING").length;
  const statPaid = orders.filter(o => o.status === "PAID").length;
  const statRefundPending = orders.filter(o => o.status === "REFUND_PENDING").length;

  const handleCardClick = (status: string) => {
    setFilterStatus(status);
    setFilterDate(""); // Reset date so we find the actionable item regardless of date
  };

  // Filter & Sort Logic
  const filteredOrders = orders.filter(o => {
    if (filterDate) {
      const orderDate = new Date(o.createdAt).toLocaleDateString('en-CA');
      if (orderDate !== filterDate) return false;
    }
    if (filterStatus !== "ALL" && o.status !== filterStatus) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().replace("#", "");
      const idMatch = o.id.toLowerCase().includes(q);
      const nameMatch = o.user?.name?.toLowerCase().includes(q) || false;
      const phoneMatch = o.user?.phone?.toLowerCase().includes(q) || false;
      if (!idMatch && !nameMatch && !phoneMatch) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "NEWEST") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "OLDEST") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === "PRICE_DESC") return Number(b.total_price) - Number(a.total_price);
    return 0;
  });

  // Helper: H-1 Warning Logic
  const isApproaching = (serviceStr: string | null) => {
    if (!serviceStr) return false;
    const match = serviceStr.match(/\((?:Tgl|Waktu): (.+?)\)/);
    if (!match) return false;
    
    try {
      const parts = match[1].split(' ');
      if (parts.length < 2) return false;
      const dateStr = `${parts[0]} ${parts[1]} ${new Date().getFullYear()}`;
      const scheduledDate = new Date(dateStr);
      if (isNaN(scheduledDate.getTime())) return false;

      // Check difference in days from today at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = scheduledDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays <= 1; // H-1, Hari H, or Past
    } catch {
      return false;
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoadingId(id);
    const result = await updateOrderStatus(id, newStatus, resiInputs?.[id]);
    if (result.error) {
      alert("Gagal merubah status: " + result.error);
    }
    setLoadingId(null);
  };

  const handleConfirmStock = async (id: string) => {
    setLoadingId(id);
    const result = await confirmStock(id);
    if (result.error) {
      alert("Gagal konfirmasi: " + result.error);
    }
    setLoadingId(null);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "var(--secondary)", marginBottom: 4 }}>
          Manajemen Transaksi
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-light)" }}>
          Pantau pembayaran, konfirmasi pesanan, dan input resi pengiriman
        </p>
      </div>

      {/* Stats Cards / Quick Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Semua Pesanan", count: statAll, status: "ALL", bg: "#f3f4f6", color: "#374151" },
          { label: "🕐 Cek Stok", count: statAwaiting, status: "AWAITING", bg: "#f5f3ff", color: "#7c3aed", hasNotif: statAwaiting > 0 },
          { label: "Menunggu Bayar", count: statPending, status: "PENDING", bg: "#fffbeb", color: "#d97706" },
          { label: "Perlu Approve", count: statPaid, status: "PAID", bg: "#eff6ff", color: "#2563eb", hasNotif: statPaid > 0 },
          { label: "Perlu Refund", count: statRefundPending, status: "REFUND_PENDING", bg: "#fef2f2", color: "#dc2626", hasNotif: statRefundPending > 0 },
        ].map(stat => {
          const isActive = filterStatus === stat.status;
          return (
            <button 
              key={stat.status}
              onClick={() => handleCardClick(stat.status)}
              style={{
                backgroundColor: stat.bg, padding: 20, borderRadius: 16, border: isActive ? `2px solid ${stat.color}` : "2px solid transparent",
                display: "flex", flexDirection: "column", alignItems: "flex-start", cursor: "pointer", position: "relative",
                boxShadow: isActive ? `0 4px 12px ${stat.color}33` : "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s"
              }}
            >
              {stat.hasNotif && (
                <div style={{ position: "absolute", top: -6, right: -6, backgroundColor: "#e11d48", color: "white", fontSize: 11, fontWeight: 800, padding: "2px 8px", borderRadius: 12, boxShadow: "0 2px 4px rgba(225,29,72,0.4)" }}>
                  {stat.count} Butuh Tindakan
                </div>
              )}
              <span style={{ fontSize: 12, fontWeight: 700, color: stat.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24, backgroundColor: "white", padding: 20, borderRadius: 16, border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.02)" }}>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flexGrow: 1, minWidth: 200 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Cari Pesanan</label>
          <input 
            type="text" 
            placeholder="No. Invoice, Nama, atau No. WA..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...s.input, width: "100%" }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Tanggal Transaksi</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input 
              type="date" 
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{ ...s.input, minWidth: 140 }}
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate("")} 
                style={{ padding: "8px 12px", borderRadius: 10, border: "none", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
              >
                Reset Tanggal
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Filter Status</label>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ ...s.input, minWidth: 160 }}
          >
            <option value="ALL">Semua Status</option>
            {Object.entries(statusConfig).map(([val, cfg]) => (
              <option key={val} value={val}>{cfg.label.replace(/[^a-zA-Z ]/g, "").trim()}</option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Urutkan Berdasarkan</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ ...s.input, minWidth: 160 }}
          >
            <option value="NEWEST">Terbaru</option>
            <option value="OLDEST">Terlama</option>
            <option value="PRICE_DESC">Nominal Tertinggi</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div style={{
        backgroundColor: "white", borderRadius: 16,
        border: "1px solid #f3f4f6",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                {["ID Pesanan", "Customer", "Total", "Status", "Resi / Aksi"].map((h) => (
                  <th key={h} style={{
                    padding: "13px 20px", textAlign: "left",
                    fontSize: 11, fontWeight: 700, color: "#9ca3af",
                    textTransform: "uppercase", letterSpacing: 0.8,
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", color: "#6b7280" }}>
                    <p style={{ fontSize: 14, fontWeight: 600 }}>Tidak ada pesanan yang sesuai dengan filter.</p>
                  </td>
                </tr>
              ) : filteredOrders.map((o) => (
                <motion.tr
                  key={o.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ borderBottom: "1px solid #f9fafb" }}
                >
                  {/* ID */}
                  <td style={{ padding: "14px 20px" }}>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", fontFamily: "monospace" }}>
                      #{o.id.slice(-6).toUpperCase()}
                    </p>
                    <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                      {new Date(o.createdAt).toLocaleDateString("id-ID")}
                    </p>
                    {o.shipping_service && (
                      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--primary)", marginTop: 6, backgroundColor: "#fff1f2", display: "inline-block", padding: "2px 6px", borderRadius: 4 }}>
                        {o.shipping_service}
                      </p>
                    )}
                  </td>

                  {/* Customer */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "linear-gradient(135deg, var(--primary), #c0395a)",
                        color: "white", display: "flex", alignItems: "center",
                        justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>
                        {o.user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{o.user.name}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", marginTop: 1 }}>{o.user.phone}</p>
                      </div>
                    </div>
                  </td>

                  {/* Total */}
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
                      Rp {Number(o.total_price).toLocaleString("id-ID")}
                    </span>
                    {Number(o.total_price) % 1000 > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: "#9f1239", backgroundColor: "#ffe4e6", padding: "4px 8px", borderRadius: 6, border: "1px solid #fecdd3" }}>
                          Kode Unik: {String(Number(o.total_price) % 1000).padStart(3, '0')}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Status Dropdown */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        disabled={loadingId === o.id}
                        style={{
                          ...s.input,
                          backgroundColor: statusConfig[o.status]?.bg || "#f9fafb",
                          color: statusConfig[o.status]?.color || "#374151",
                          borderColor: statusConfig[o.status]?.border || "#e5e7eb",
                          fontWeight: 700, cursor: "pointer",
                          opacity: loadingId === o.id ? 0.6 : 1,
                          minWidth: 150,
                          appearance: "auto",
                        }}
                      >
                        {Object.entries(statusConfig).map(([val, cfg]) => (
                          <option key={val} value={val}>{cfg.label}</option>
                        ))}
                      </select>
                      
                      {o.payment_proof && (
                        <a 
                          href={o.payment_proof} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: 11, fontWeight: 700, color: "#991b1b", textDecoration: "underline", textUnderlineOffset: 2 }}
                        >
                          Lihat Bukti Transfer
                        </a>
                      )}
                      
                      {isApproaching(o.shipping_service) && o.status === "APPROVED" && (
                        <div style={{ padding: "6px 8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, maxWidth: 150 }}>
                          <p style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", margin: 0, lineHeight: 1.4 }}>
                            ⚠️ Mendekati H-1!<br/>Segera proses ke status Shipped.
                          </p>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Resi + Save */}
                  <td style={{ padding: "14px 20px" }}>
                    {o.status === "COMPLETED" ? (
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#047857", backgroundColor: "#ecfdf5", padding: "6px 12px", borderRadius: 8, border: "1px solid #a7f3d0" }}>
                          {o.shipping_service?.includes("Ambil") ? "✅ Sudah Diambil" : "✅ Selesai Diterima"}
                        </span>
                        {o.shipping_resi && (
                          <span style={{ fontSize: 11, color: "#6b7280", backgroundColor: "#f3f4f6", padding: "4px 8px", borderRadius: 6, border: "1px dashed #d1d5db" }}>
                            {o.shipping_resi}
                          </span>
                        )}
                      </div>
                    ) : o.status === "SHIPPED" ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 240 }}>
                        <input
                          type="text"
                          placeholder={o.shipping_service?.includes("Ambil") ? "Catatan / Waktu Diambil (Opsional)" : "No. Resi Pengiriman (Opsional)"}
                          style={{ ...s.input, flex: 1, fontFamily: o.shipping_service?.includes("Ambil") ? "var(--font-sans)" : "monospace" }}
                          value={resiInputs[o.id] !== undefined ? resiInputs[o.id] : (o.shipping_resi || "")}
                          onChange={(e) => setResiInputs({ ...resiInputs, [o.id]: e.target.value })}
                        />
                        <button
                          onClick={() => handleStatusChange(o.id, o.status)}
                          disabled={loadingId === o.id}
                          style={{
                            padding: "8px 14px", borderRadius: 10, border: "none",
                            backgroundColor: "var(--primary)", color: "white",
                            fontSize: 12, fontWeight: 700, cursor: "pointer",
                            flexShrink: 0,
                          }}
                        >
                          Simpan
                        </button>
                      </div>
                    ) : o.status === "REFUND_PENDING" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start", backgroundColor: "#fefce8", padding: 12, borderRadius: 12, border: "1px solid #fef08a" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#854d0e", display: "flex", alignItems: "center", gap: 4 }}>
                          🏦 Rekening Customer:
                        </span>
                        <span style={{ fontSize: 12, color: "#713f12", fontWeight: 800, fontFamily: "monospace", userSelect: "all", backgroundColor: "white", padding: "4px 8px", borderRadius: 6, border: "1px dashed #ca8a04", width: "100%", wordBreak: "break-all" }}>
                          {o.refund_account || "Belum ada informasi"}
                        </span>
                        <button
                          onClick={() => handleStatusChange(o.id, "REFUND_COMPLETED")}
                          disabled={loadingId === o.id}
                          style={{
                            padding: "8px 14px", borderRadius: 10, border: "none",
                            backgroundColor: "#16a34a", color: "white",
                            fontSize: 11, fontWeight: 700, cursor: "pointer",
                            width: "100%", marginTop: 4,
                          }}
                        >
                          ✅ Tandai Refund Selesai
                        </button>
                      </div>
                    ) : o.status === "REFUND_COMPLETED" ? (
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#047857", backgroundColor: "#ecfdf5", padding: "6px 12px", borderRadius: 8, border: "1px solid #a7f3d0" }}>
                          ✅ Dana Telah Dikembalikan
                        </span>
                      </div>
                    ) : o.status === "AWAITING" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start" }}>
                        <div style={{ padding: "10px 12px", backgroundColor: "#f5f3ff", borderRadius: 10, border: "1px solid #ddd6fe", maxWidth: 200 }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: "#6d28d9", margin: 0, lineHeight: 1.5 }}>🕐 Pesanan menunggu konfirmasi ketersediaan stok</p>
                          <p style={{ fontSize: 10, color: "#8b5cf6", margin: "4px 0 0 0" }}>Auto-cancel dalam 2 hari jika tidak dikonfirmasi</p>
                        </div>
                        <button
                          onClick={() => handleConfirmStock(o.id)}
                          disabled={loadingId === o.id}
                          style={{
                            padding: "8px 14px", borderRadius: 10, border: "none",
                            backgroundColor: loadingId === o.id ? "#9ca3af" : "#16a34a", color: "white",
                            fontSize: 12, fontWeight: 700, cursor: loadingId === o.id ? "not-allowed" : "pointer",
                          }}
                        >
                          {loadingId === o.id ? "Memproses..." : "✅ Stok Tersedia, Minta Bayar"}
                        </button>
                        <button
                          onClick={() => handleStatusChange(o.id, "CANCELLED")}
                          disabled={loadingId === o.id}
                          style={{
                            padding: "8px 14px", borderRadius: 10, border: "1px solid #fecaca",
                            backgroundColor: "#fef2f2", color: "#dc2626",
                            fontSize: 11, fontWeight: 700, cursor: "pointer",
                          }}
                        >
                          ❌ Stok Habis, Batalkan
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "6px 12px", borderRadius: 8,
                          fontSize: 12, fontFamily: "monospace", fontWeight: 600,
                          backgroundColor: "#f9fafb", color: "#9ca3af",
                          border: "1px solid #f3f4f6",
                        }}>
                          {o.shipping_resi || "Belum ada resi"}
                        </span>
                        
                        {o.status === "PENDING" && o.user?.phone && (
                          <a
                            href={`https://wa.me/${o.user.phone.replace(/[^0-9]/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(`Halo Kak ${o.user.name},\n\nIni dari *Brownis Cinta*. Kami melihat ada tagihan pesanan sebesar *Rp ${Number(o.total_price).toLocaleString('id-ID')}* yang belum diselesaikan (Order ID: #${o.id.slice(-6).toUpperCase()}).\n\nMohon segera klik tombol "Pesananku" di website kami dan upload bukti transfer ya kak agar pesanan dapat segera kami proses.\n\nTerima kasih! 🍫`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "6px 12px", borderRadius: 8, border: "1px solid #10b981",
                              backgroundColor: "#ecfdf5", color: "#059669", textDecoration: "none",
                              fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6
                            }}
                          >
                            💬 Ingatkan via WA
                          </a>
                        )}
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "48px 20px", textAlign: "center" }}>
                    <p style={{ fontSize: 36, marginBottom: 12 }}>📦</p>
                    <p style={{ fontSize: 14, color: "#9ca3af", fontWeight: 600 }}>Belum ada transaksi masuk.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
