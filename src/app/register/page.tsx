"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dob: "",
    address: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal registrasi");
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--background)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 16px",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: "100%", maxWidth: 460 }}
      >
        {/* Card */}
        <div style={{
          backgroundColor: "var(--surface)",
          borderRadius: 20,
          boxShadow: "0 8px 40px rgba(74,44,42,0.12)",
          border: "1px solid var(--border)",
          overflow: "hidden",
        }}>

          {/* Header */}
          <div style={{
            backgroundColor: "var(--primary)",
            padding: "32px 40px",
            textAlign: "center",
          }}>
            <div style={{
              width: 50, height: 50,
              background: "rgba(255,255,255,0.18)",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 12px",
            }}>
              <span style={{ color: "white", fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 20 }}>B</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-serif)", color: "white", fontSize: 21, fontWeight: 700, marginBottom: 5 }}>
              Daftar Akun
            </h1>
            <p style={{ color: "rgba(255,210,210,0.9)", fontSize: 13 }}>
              Bergabunglah dengan pelanggan setia Brownis Cinta
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: "32px 40px" }}>

            {error && (
              <div style={{
                background: "#fef2f2", color: "#dc2626",
                padding: "10px 16px", borderRadius: 10,
                marginBottom: 22, fontSize: 13,
                border: "1px solid #fecaca",
              }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input type="text" name="name" className="form-input"
                  value={formData.name} onChange={handleChange}
                  placeholder="Contoh: Budi Santoso" required />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor HP / WhatsApp</label>
                <input type="text" name="phone" className="form-input"
                  value={formData.phone} onChange={handleChange}
                  placeholder="Contoh: 08123456789" required />
              </div>

              <div className="form-group">
                <label className="form-label">Tanggal Lahir</label>
                <input type="date" name="dob" className="form-input"
                  value={formData.dob} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Pengiriman Default</label>
                <textarea name="address" className="form-input"
                  style={{ minHeight: 88, resize: "vertical" }}
                  value={formData.address} onChange={handleChange}
                  placeholder="Alamat lengkap Anda" required />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" name="password" className="form-input"
                  value={formData.password} onChange={handleChange}
                  placeholder="Buat password yang kuat (min. 6 karakter)"
                  required minLength={6} />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  backgroundColor: loading ? "#9ca3af" : "var(--primary)",
                  color: "white",
                  padding: "13px 24px",
                  border: "none",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  marginTop: 4,
                }}
              >
                {loading ? "Memproses..." : "Daftar Sekarang"}
              </button>
            </form>

            <div style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--border)",
              textAlign: "center",
              fontSize: 14,
              color: "var(--text-light)",
            }}>
              Sudah punya akun?{" "}
              <Link href="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
                Masuk di sini
              </Link>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 20 }}>
          © 2026 Brownis Cinta Official
        </p>
      </motion.div>
    </div>
  );
}
