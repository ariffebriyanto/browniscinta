import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CartIcon from "@/components/CartIcon";
import ProductActions from "@/components/ProductActions";

export default async function Home() {
  const session = await getServerSession(authOptions);

  const rawProducts = await prisma.product.findMany({
    orderBy: [
      { display_order: "asc" },
      { createdAt: "desc" }
    ],
  });
  
  let actionNeededCount = 0;
  if (session?.user) {
    if (session.user.role === "OWNER") {
      actionNeededCount = await prisma.order.count({
        where: { status: { in: ["PAID", "REFUND_PENDING"] } }
      });
    } else {
      actionNeededCount = await prisma.order.count({
        where: {
          user_id: parseInt(session.user.id as string),
          status: { in: ["PENDING", "REFUND_REQUESTED", "SHIPPED"] }
        }
      });
    }
  }
  
  const dbProducts = rawProducts.map(p => ({
    ...p,
    price: Number(p.price)
  }));

  const products = dbProducts.length > 0 ? dbProducts : [
    { id: 1, name: "Dessert Lumer Mini Size", price: 25000, image_url: "/dessert_lumer.png", description: "Choco Delight / Cookies & Cream / Say Cheese / Tiramissu Coffee", is_bestseller: true },
    { id: 2, name: "Roti Ring Selai", price: 12000, image_url: "/roti_ring.png", description: "Dua Rasa, Hangatkan Keluarga Tercinta dengan Roti Lembut", is_bestseller: true },
    { id: 3, name: "Brownies Choco Hitam Putih", price: 35000, image_url: "/hero_bg.png", description: "Best Seller Browcin Bakery dengan Cokelat Melimpah", is_bestseller: true },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", display: "flex", flexDirection: "column" }}>

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        backgroundColor: "rgba(255,255,255,0.95)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.04)"
      }}>
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingBottom: 14 }}>
          <Link href="/" style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--primary)", fontSize: 20 }}>
            Brownis Cinta
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {session?.user?.role !== "OWNER" && <CartIcon />}
            {session ? (
              <>
                <span style={{ fontSize: 13, color: "var(--secondary)", fontWeight: 600 }}>
                  Halo, {session.user?.name}
                </span>
                <Link
                  href={session.user?.role === "OWNER" ? "/owner/dashboard" : "/customer/dashboard"}
                  style={{
                    backgroundColor: "var(--primary)", color: "white",
                    padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", gap: 6, position: "relative"
                  }}
                >
                  {actionNeededCount > 0 && (
                    <span style={{ position: "absolute", top: -8, right: -8, backgroundColor: "#e11d48", color: "white", fontSize: 10, fontWeight: 800, padding: "3px 7px", borderRadius: 10, boxShadow: "0 2px 4px rgba(225, 29, 72, 0.4)" }}>
                      {actionNeededCount} Notif
                    </span>
                  )}
                  Dashboard →
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" style={{
                  fontSize: 13, fontWeight: 700, color: "var(--secondary)",
                  border: "1.5px solid var(--border)", padding: "7px 16px",
                  borderRadius: 10, transition: "all 0.2s"
                }}>
                  Masuk
                </Link>
                <Link href="/register" style={{
                  backgroundColor: "var(--primary)", color: "white",
                  padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                }}>
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ paddingTop: 60, paddingBottom: 60 }}>
        <div className="container">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 48,
            alignItems: "center",
          }}>
            {/* Left: Text */}
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                backgroundColor: "#fff1f2", color: "var(--primary)",
                padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                border: "1px solid #fecdd3", marginBottom: 20,
              }}>
                ✓ Promo Pesanan Indent H-2 Aktif
              </div>

              <h1 style={{
                fontFamily: "var(--font-serif)", color: "var(--secondary)",
                fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 700,
                lineHeight: 1.2, marginBottom: 16,
              }}>
                Manisnya Cinta<br />dalam Setiap Gigitan.
              </h1>

              <p style={{ color: "var(--text-light)", fontSize: 14, lineHeight: 1.7, marginBottom: 24, maxWidth: 400 }}>
                Pesan Dessert Lumer, Roti Ring, dan Brownies favoritmu sekarang. Nikmati kemudahan memesan dengan pengiriman JNE Reguler terpercaya.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 28 }}>
                {["⭐ Premium Quality", "🕐 Fresh Harian", "🚚 Pengiriman JNE"].map(b => (
                  <span key={b} style={{
                    fontSize: 12, fontWeight: 600, color: "var(--text-light)",
                    background: "white", padding: "6px 14px",
                    borderRadius: 999, border: "1px solid var(--border)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
                  }}>{b}</span>
                ))}
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="#products" style={{
                  backgroundColor: "var(--primary)", color: "white",
                  padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                  display: "inline-flex", alignItems: "center", gap: 8,
                  boxShadow: "0 4px 15px rgba(139,28,49,0.25)",
                }}>
                  Lihat Menu →
                </a>
                {!session && (
                  <Link href="/register" style={{
                    border: "2px solid var(--primary)", color: "var(--primary)",
                    padding: "11px 24px", borderRadius: 12, fontSize: 14, fontWeight: 700,
                  }}>
                    Daftar Gratis
                  </Link>
                )}
              </div>
            </div>

            {/* Right: Image */}
            <div style={{ position: "relative" }}>
              <div style={{
                background: "white", padding: 12, borderRadius: 20,
                boxShadow: "0 8px 40px rgba(139,28,49,0.12)",
                border: "1px solid var(--border)"
              }}>
                <img
                  src="/hero_bg.png"
                  alt="Brownies Premium"
                  style={{ width: "100%", height: 320, objectFit: "cover", borderRadius: 14, display: "block" }}
                />
                <div style={{
                  position: "absolute", bottom: 28, left: 28,
                  background: "rgba(255,255,255,0.97)",
                  padding: "10px 16px", borderRadius: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                  border: "1px solid var(--border)"
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: "var(--secondary)" }}>Best Seller ⭐</p>
                  <p style={{ fontSize: 11, color: "var(--text-light)", marginTop: 2 }}>Brownies Choco Premium</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" style={{ paddingBottom: 64 }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
              Eksplorasi Rasa
            </p>
            <h2 style={{ fontFamily: "var(--font-serif)", color: "var(--secondary)", fontSize: "clamp(22px, 3vw, 32px)", marginBottom: 8 }}>
              Katalog Menu Kami
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-light)" }}>Terbuat dari bahan premium & dibuat fresh setiap harinya</p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}>
            {products.map((product) => (
              <div key={product.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", overflow: "hidden", height: 200, backgroundColor: "#f9fafb" }}>
                  <img
                    src={product.image_url || "/hero_bg.png"}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  {product.is_bestseller && (
                    <span style={{
                      position: "absolute", top: 12, right: 12,
                      backgroundColor: "#f59e0b", color: "white",
                      fontSize: 10, fontWeight: 700, padding: "4px 10px",
                      borderRadius: 8, letterSpacing: 0.5, textTransform: "uppercase"
                    }}>
                      Best Seller ⭐
                    </span>
                  )}
                </div>
                <div style={{ padding: "20px 20px 18px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: "var(--secondary)", marginBottom: 6 }}>
                    {product.name}
                  </h3>
                  <p style={{ fontSize: 12, color: "#9ca3af", lineHeight: 1.5, flex: 1 }}>
                    {product.description}
                  </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, color: "var(--primary)", fontSize: 18 }}>
                        Rp {Number(product.price).toLocaleString('id-ID')}
                      </span>
                    </div>
                    {session?.user?.role !== "OWNER" && (
                      <ProductActions product={product} />
                    )}
                  </div>
                </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ backgroundColor: "var(--secondary)", color: "white", marginTop: "auto" }}>
        <div className="container" style={{ paddingTop: 40, paddingBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--accent)", fontSize: 18, marginBottom: 6 }}>
                Brownis Cinta
              </p>
              <p style={{ fontSize: 12, color: "#9ca3af", maxWidth: 360, lineHeight: 1.6 }}>
                Menghadirkan kelezatan brownies premium, roti lembut, dan dessert lumer untuk setiap momen kebersamaan Anda.
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "#6b7280" }}>© 2026 Brownis Cinta Official. All rights reserved.</p>
              <p style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>Dibuat dengan cinta untuk keluarga tercinta 🍫</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
