"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.startsWith("62")) {
      setError("Format salah. Nomor HP harus diawali dengan 62 (contoh: 62812...)");
      return;
    }
    if (!/^\d+$/.test(phone)) {
      setError("Format salah. Nomor HP hanya boleh berisi angka.");
      return;
    }

    setLoading(true);
    setError("");
    const res = await signIn("credentials", { phone, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "var(--background)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: "100%", maxWidth: 420 }}
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
            padding: "36px 40px",
            textAlign: "center",
          }}>
            <div style={{
              width: 52, height: 52,
              background: "rgba(255,255,255,0.18)",
              borderRadius: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <span style={{ color: "white", fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 22 }}>B</span>
            </div>
            <h1 style={{ fontFamily: "var(--font-serif)", color: "white", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
              Brownis Cinta
            </h1>
            <p style={{ color: "rgba(255,210,210,0.9)", fontSize: 13, fontWeight: 500 }}>
              Masuk ke akun Anda
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: "36px 40px" }}>

            {error && (
              <div style={{
                background: "#fef2f2", color: "#dc2626",
                padding: "10px 16px", borderRadius: 10,
                marginBottom: 24, fontSize: 13,
                border: "1px solid #fecaca",
              }}>
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nomor HP / WhatsApp</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if (val.startsWith("0")) {
                      val = "62" + val.slice(1);
                    }
                    setPhone(val);
                  }}
                  placeholder="Contoh: 6281234567890"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  required
                />
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
                  marginTop: 8,
                }}
              >
                {loading ? "Memproses..." : "Masuk"}
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
              Belum punya akun?{" "}
              <Link href="/register" style={{ color: "var(--primary)", fontWeight: 700 }}>
                Daftar di sini
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
