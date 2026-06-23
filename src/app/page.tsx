import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import CartIcon from "@/components/CartIcon";
import Catalog from "@/components/Catalog";
import TopProductsSlider from "@/components/TopProductsSlider";

export default async function Home() {
  console.log("Force Recompile Home Page - Cache Invalidation 123");
  const session = await getServerSession(authOptions);

  const rawProducts = await prisma.product.findMany({
    include: {
      orderItems: {
        select: {
          quantity: true,
          order: {
            select: { status: true }
          }
        }
      }
    },
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
  
  const dbProducts = rawProducts.map(p => {
    const validStatuses = ["PAID", "APPROVED", "SHIPPED", "COMPLETED"];
    const soldCount = p.orderItems
      .filter(item => validStatuses.includes(item.order.status))
      .reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      stock: p.stock,
      image_url: p.image_url,
      is_bestseller: p.is_bestseller,
      display_order: p.display_order,
      category: p.category,
      expiration_days: p.expiration_days,
      soldCount
    };
  });

  const products = dbProducts;
  
  // Ambil 6 produk terlaris
  const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 6);

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

      {/* TOP SELLING SLIDER */}
      {topProducts.length > 0 && (
        <TopProductsSlider topProducts={topProducts} />
      )}

      {/* PRODUCTS */}
      <section id="products" style={{ paddingTop: 64, paddingBottom: 64 }}>
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

          <Catalog products={products} session={session} />
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
