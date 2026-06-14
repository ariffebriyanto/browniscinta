"use client";

import { useState } from "react";
import { updateUser, deleteUser } from "./actions";
import { motion, AnimatePresence } from "framer-motion";

const s = {
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 6 } as React.CSSProperties,
  input: {
    width: "100%", padding: "10px 14px",
    border: "1.5px solid #e5e7eb", borderRadius: 10,
    fontSize: 14, fontFamily: "var(--font-sans)", outline: "none",
    backgroundColor: "#f9fafb", color: "#111827",
    boxSizing: "border-box" as const, transition: "border-color 0.15s",
  } as React.CSSProperties,
};

export default function UserClient({ users }: { users: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", address: "", role: "CUSTOMER", password: "" });
  const [loading, setLoading] = useState(false);

  const ownerCount = users.filter(u => u.role === "OWNER").length;
  const customerCount = users.filter(u => u.role === "CUSTOMER").length;

  const openModal = (user: any) => {
    setEditingId(user.id);
    setFormData({ name: user.name, phone: user.phone, address: user.address || "", role: user.role, password: "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (editingId) await updateUser(editingId, formData);
    setLoading(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Hapus user ini?")) await deleteUser(id);
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "var(--secondary)", marginBottom: 4 }}>
            Daftar Pengguna
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-light)" }}>
            Kelola data pelanggan dan administrator aplikasi
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: "#f5f3ff", color: "#7c3aed", border: "1px solid #ddd6fe" }}>
            👑 {ownerCount} Owner
          </span>
          <span style={{ padding: "7px 14px", borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: "#f9fafb", color: "#6b7280", border: "1px solid #f3f4f6" }}>
            👤 {customerCount} Customer
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ backgroundColor: "white", borderRadius: 16, border: "1px solid #f3f4f6", boxShadow: "0 2px 12px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                {["Pengguna", "Nomor HP", "Role", "Aksi"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 20px", textAlign: "left",
                    fontSize: 11, fontWeight: 700, color: "#9ca3af",
                    textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 14, color: "white",
                        background: u.role === "OWNER"
                          ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                          : "linear-gradient(135deg, var(--primary), #c0395a)",
                      }}>
                        {u.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: 13, color: "#6b7280", fontFamily: "monospace" }}>{u.phone}</span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      display: "inline-block", padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                      backgroundColor: u.role === "OWNER" ? "#f5f3ff" : "#f9fafb",
                      color: u.role === "OWNER" ? "#7c3aed" : "#6b7280",
                      border: `1px solid ${u.role === "OWNER" ? "#ddd6fe" : "#f3f4f6"}`,
                    }}>
                      {u.role === "OWNER" ? "👑 OWNER" : "👤 CUSTOMER"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => openModal(u)}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "none", backgroundColor: "#eff6ff", color: "#2563eb", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                      >✏️ Edit</button>
                      {u.role !== "OWNER" && (
                        <button
                          onClick={() => handleDelete(u.id)}
                          style={{ padding: "6px 12px", borderRadius: 8, border: "none", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                        >🗑️ Hapus</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)", zIndex: 999,
              display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{
                backgroundColor: "white", borderRadius: 20,
                width: "100%", maxWidth: 480,
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column",
              }}
            >
              {/* Header */}
              <div style={{ padding: "20px 28px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fafafa" }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>✏️ Edit Akun Pengguna</h3>
                <button onClick={() => setIsModalOpen(false)} style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18 }}>×</button>
              </div>

              {/* Body */}
              <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
                <form id="userForm" onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
                  <div>
                    <label style={s.label}>Nama Lengkap *</label>
                    <input type="text" required style={s.input} value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                  </div>
                  <div>
                    <label style={s.label}>Nomor HP</label>
                    <input type="text" required style={s.input} value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                  </div>
                  <div>
                    <label style={s.label}>Alamat</label>
                    <textarea rows={2} style={{ ...s.input, resize: "none" as const }} value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                  </div>
                  <div>
                    <label style={s.label}>Role</label>
                    <select style={s.input} value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      <option value="CUSTOMER">👤 Customer</option>
                      <option value="OWNER">👑 Owner (Administrator)</option>
                    </select>
                  </div>
                  <div>
                    <label style={s.label}>Password Baru <span style={{ color: "#9ca3af", fontWeight: 400, fontSize: 11 }}>(Opsional, kosongkan jika tidak diubah)</span></label>
                    <input type="password" style={s.input} value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Biarkan kosong jika tidak ingin mengubah"
                      onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                      onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")} />
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div style={{ padding: "16px 28px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "flex-end", gap: 12, backgroundColor: "#fafafa" }}>
                <button onClick={() => setIsModalOpen(false)} style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e5e7eb", backgroundColor: "white", fontSize: 14, fontWeight: 700, color: "#374151", cursor: "pointer" }}>
                  Batal
                </button>
                <button type="submit" form="userForm" disabled={loading} style={{ padding: "10px 24px", borderRadius: 10, border: "none", backgroundColor: loading ? "#9ca3af" : "var(--primary)", color: "white", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(139,28,49,0.2)" }}>
                  {loading ? "Menyimpan..." : "💾 Simpan"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
