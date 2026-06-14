"use client";

import { useState } from "react";
import { updateSettings } from "./actions";
import { motion } from "framer-motion";

const s = {
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 } as React.CSSProperties,
  input: {
    width: "100%", padding: "10px 14px",
    border: "1.5px solid #e5e7eb", borderRadius: 10,
    fontSize: 14, fontFamily: "var(--font-sans)", outline: "none",
    backgroundColor: "#f9fafb", color: "#111827",
    boxSizing: "border-box" as const,
  } as React.CSSProperties,
  card: {
    backgroundColor: "white", borderRadius: 16,
    border: "1px solid #f3f4f6",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    padding: "24px 28px",
    marginBottom: 20,
  } as React.CSSProperties,
};

export default function SettingsClient({ settings }: { settings: Record<string, string> }) {
  const [formData, setFormData] = useState({
    store_name: settings.store_name || "Brownis Cinta",
    store_phone: settings.store_phone || "08123456789",
    store_address: settings.store_address || "Jl. Contoh Alamat Toko",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    setLoading(true);
    const result = await updateSettings({ ...formData });
    setLoading(false);
    if (result.success) {
      setSuccess("✅ Pengaturan toko berhasil diperbarui!");
    } else {
      setError(result.error || "Terjadi kesalahan.");
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "var(--secondary)", marginBottom: 4 }}>
          Pengaturan Toko
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-light)" }}>
          Perbarui informasi toko, alamat, dan kontak utama
        </p>
      </div>

      {/* Profile Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Alert messages */}
        {success && (
          <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, fontWeight: 600, color: "#16a34a" }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 20, fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Store Details Section */}
          <div style={s.card}>
            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={s.label}>Nama Toko *</label>
                <input type="text" required style={s.input}
                  value={formData.store_name}
                  onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
              <div>
                <label style={s.label}>Nomor WhatsApp (CS) *</label>
                <input type="text" required style={s.input}
                  value={formData.store_phone}
                  onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
              <div>
                <label style={s.label}>Alamat Toko</label>
                <textarea rows={3} style={{ ...s.input, resize: "none" as const }}
                  value={formData.store_address}
                  onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                  placeholder="Alamat lengkap..."
                  onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                  onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "13px 24px",
              borderRadius: 12, border: "none",
              backgroundColor: loading ? "#9ca3af" : "var(--primary)",
              color: "white", fontSize: 15, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 4px 16px rgba(139,28,49,0.2)",
              transition: "all 0.2s",
            }}
          >
            {loading ? "Menyimpan Perubahan..." : "💾 Simpan Pengaturan"}
          </button>

        </form>
      </motion.div>
    </div>
  );
}
