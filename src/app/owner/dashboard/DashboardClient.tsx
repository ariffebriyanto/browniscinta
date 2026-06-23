"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface DashboardClientProps {
  currentFilter: string;
  stats: {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalMargin: number;
  };
  statusDistribution: {
    PENDING: number;
    PAID: number;
    APPROVED: number;
    SHIPPED: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  salesTrend: Array<{ month: string; amount: number }>;
  topProducts: Array<{ name: string; quantity: number }>;
}

const card: React.CSSProperties = {
  backgroundColor: "white",
  borderRadius: 16,
  border: "1px solid #f3f4f6",
  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
  padding: "20px 24px",
};

export default function DashboardClient({
  currentFilter,
  stats,
  statusDistribution,
  salesTrend,
  topProducts,
}: DashboardClientProps) {
  const router = useRouter();
  
  const maxSales = Math.max(...salesTrend.map((t) => t.amount), 1);
  const maxQty = Math.max(...topProducts.map((p) => p.quantity), 1);

  const activeOrders = statusDistribution.PAID + statusDistribution.APPROVED + statusDistribution.SHIPPED;
  const totalStatus = Object.values(statusDistribution).reduce((a, b) => a + b, 0);

  const statCards = [
    {
      label: "Total Pendapatan (Bruto)",
      value: `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`,
      sub: currentFilter === "today" ? "Penjualan hari ini" : currentFilter === "this_month" ? "Penjualan bulan ini" : "Total seluruh penjualan",
      icon: "💰",
      bg: "#fff1f2",
      iconColor: "var(--primary)",
    },
    {
      label: "Margin / Netto",
      value: `Rp ${stats.totalMargin.toLocaleString("id-ID")}`,
      sub: currentFilter === "today" ? "Keuntungan hari ini" : currentFilter === "this_month" ? "Keuntungan bulan ini" : "Total keuntungan bersih",
      icon: "📈",
      bg: "#ecfdf5",
      iconColor: "#059669",
    },
    {
      label: "Total Pesanan",
      value: stats.totalOrders,
      sub: currentFilter === "today" ? "Transaksi hari ini" : currentFilter === "this_month" ? "Transaksi bulan ini" : "Seluruh transaksi",
      icon: "🛒",
      bg: "#fffbeb",
      iconColor: "#d97706",
    },
    {
      label: "Total Pelanggan",
      value: stats.totalUsers,
      sub: "Customer terdaftar",
      icon: "👥",
      bg: "#eff6ff",
      iconColor: "#2563eb",
    },
    {
      label: "Menu Aktif",
      value: stats.totalProducts,
      sub: "Macam kue di etalase",
      icon: "🍰",
      bg: "#f0fdf4",
      iconColor: "#16a34a",
    },
  ];

  const statusSegments = [
    { label: "Selesai", value: statusDistribution.COMPLETED, color: "#10b981" },
    { label: "Diproses", value: activeOrders, color: "#3b82f6" },
    { label: "Pending", value: statusDistribution.PENDING, color: "#f59e0b" },
    { label: "Batal", value: statusDistribution.CANCELLED, color: "#f43f5e" },
  ];

  // Donut chart
  const r = 40;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 40 }}>
      {/* Filters & Header */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 32, gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--secondary)", letterSpacing: -0.5 }}>Ringkasan Bisnis</h1>
          <p style={{ color: "#6b7280", marginTop: 4 }}>Pantau performa penjualan dan statistik Brownis Cinta</p>
        </div>
        <select
          value={currentFilter}
          onChange={(e) => {
            router.push(`/owner/dashboard?filter=${e.target.value}`);
          }}
          style={{
            padding: "8px 16px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            backgroundColor: "white",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--secondary)",
            cursor: "pointer",
            outline: "none",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}
        >
          <option value="all">Semua Waktu</option>
          <option value="this_month">Bulan Ini</option>
          <option value="today">Hari Ini</option>
        </select>
      </div>

      {/* Top Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
          >
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
                {s.label}
              </p>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1.1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{s.sub}</p>
            </div>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: s.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, flexShrink: 0,
            }}>
              {s.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 24 }}>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          style={{ ...card }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>📈 Tren Pendapatan Bulanan</p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 20 }}>Statistik penjualan 6 bulan terakhir</p>

          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 400 }}>
              {/* Y-axis labels + bars */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 160, padding: "0 8px" }}>
                {salesTrend.map((data, i) => {
                  const pct = maxSales > 0 ? (data.amount / maxSales) : 0;
                  const barH = Math.max(pct * 140, 2);
                  return (
                    <div
                      key={i}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
                      title={`Rp ${data.amount.toLocaleString("id-ID")}`}
                    >
                      <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>
                        {data.amount > 0 ? `${(data.amount / 1000).toFixed(0)}k` : ""}
                      </span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: barH }}
                        transition={{ delay: 0.4 + i * 0.08, duration: 0.5, ease: "easeOut" }}
                        style={{
                          width: "100%",
                          background: "linear-gradient(180deg, var(--primary) 0%, #e5a872 100%)",
                          borderRadius: "6px 6px 0 0",
                          minHeight: 2,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* X labels */}
              <div style={{ display: "flex", gap: 12, padding: "8px 8px 0" }}>
                {salesTrend.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>
                    {d.month}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Donut Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          style={{ ...card }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>Status Transaksi</p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 20 }}>Pembagian status pesanan</p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div style={{ position: "relative", width: 100, height: 100 }}>
              <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                {totalStatus === 0 ? (
                  <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
                ) : (
                  statusSegments.map((seg, i) => {
                    if (!seg.value) return null;
                    const pct = seg.value / totalStatus;
                    const dash = pct * circ;
                    const segOffset = circ - dash + offset;
                    offset -= dash;
                    return (
                      <circle
                        key={i} cx="50" cy="50" r={r}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="11"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeDashoffset={segOffset}
                        strokeLinecap="round"
                      />
                    );
                  })
                )}
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>{totalStatus}</span>
                <span style={{ fontSize: 9, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>Order</span>
              </div>
            </div>

            <div style={{ width: "100%" }}>
              {statusSegments.map((seg) => (
                <div key={seg.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: seg.color, flexShrink: 0, display: "inline-block" }} />
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>{seg.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>
                    {seg.value}
                    <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 400, marginLeft: 3 }}>
                      ({totalStatus > 0 ? ((seg.value / totalStatus) * 100).toFixed(0) : 0}%)
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.4 }}
          style={{ ...card }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>🏆 Kue Terlaris / Terfavorit</p>
          <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 20 }}>Ranking produk berdasarkan jumlah item terjual</p>

          {topProducts.length === 0 ? (
            <p style={{ fontSize: 13, color: "#9ca3af", textAlign: "center", padding: "24px 0" }}>Belum ada data penjualan.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {topProducts.map((p, i) => {
                const pct = (p.quantity / maxQty) * 100;
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          width: 22, height: 22, borderRadius: 6,
                          backgroundColor: "#fff1f2", color: "var(--primary)",
                          fontSize: 11, fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>{p.name}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", fontVariantNumeric: "tabular-nums" }}>
                        {p.quantity} pcs
                      </span>
                    </div>
                    <div style={{ height: 6, backgroundColor: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.6, ease: "easeOut" }}
                        style={{
                          height: "100%",
                          background: "linear-gradient(90deg, var(--primary), #e5a872)",
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* System Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          style={{ ...card, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>🔔 Pemberitahuan Sistem</p>
            <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.6, marginBottom: 16 }}>
              Semua data laporan di dashboard ini bersumber langsung dari database transaksi secara real-time.
            </p>
            <div style={{
              backgroundColor: "#fff1f2",
              border: "1px solid #fecdd3",
              borderRadius: 10,
              padding: "12px 14px",
              fontSize: 12,
              color: "var(--primary)",
              lineHeight: 1.6,
            }}>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>💡 Pengingat</p>
              Pesanan dengan status <strong>PENDING</strong> harus diperiksa bukti transfernya sebelum diubah ke <strong>APPROVED</strong>.
            </div>
          </div>
          <div style={{
            borderTop: "1px solid #f3f4f6",
            marginTop: 16, paddingTop: 14,
            display: "flex", justifyContent: "space-between",
            fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase",
          }}>
            <span>Version 1.0.0</span>
            <span>Brownis Cinta © 2026</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
