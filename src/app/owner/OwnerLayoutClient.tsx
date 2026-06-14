"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Package, ShoppingCart, Settings, LogOut, Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const menuItems = [
  { name: "Dashboard", href: "/owner/dashboard", icon: LayoutDashboard },
  { name: "Pesanan", href: "/owner/orders", icon: ShoppingCart },
  { name: "Master Produk", href: "/owner/products", icon: Package },
  { name: "Master User", href: "/owner/users", icon: Users },
  { name: "Pengaturan", href: "/owner/settings", icon: Settings },
];

const SIDEBAR_OPEN = 240;
const SIDEBAR_CLOSED = 72;

export default function OwnerLayoutClient({
  children,
  userName,
  actionNeededCount = 0,
}: {
  children: React.ReactNode;
  userName: string | null | undefined;
  actionNeededCount?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const activeItem = menuItems.find((item) => pathname.startsWith(item.href));
  const pageTitle = activeItem ? activeItem.name : "Dashboard";

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo */}
      <div style={{
        padding: "20px 20px",
        borderBottom: "1px solid #f3f4f6",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minHeight: 76,
        overflow: "hidden",
      }}>
        <div style={{
          width: 36, height: 36,
          background: "var(--primary)",
          color: "white",
          borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 18,
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(139,28,49,0.3)",
        }}>B</div>
        {(isOpen || mobile) && (
          <div style={{ overflow: "hidden" }}>
            <p style={{ fontFamily: "var(--font-serif)", fontWeight: 700, color: "var(--primary)", fontSize: 16, whiteSpace: "nowrap" }}>
              Admin Panel
            </p>
            <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
              Brownis Cinta
            </p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              title={!isOpen && !mobile ? item.name : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: 10,
                marginBottom: 4,
                backgroundColor: isActive ? "#fff1f2" : "transparent",
                color: isActive ? "var(--primary)" : "#6b7280",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                position: "relative",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {isActive && (
                <div style={{
                  position: "absolute", left: 0, top: 8, bottom: 8,
                  width: 3, backgroundColor: "var(--primary)", borderRadius: "0 4px 4px 0",
                }} />
              )}
              <item.icon size={18} style={{ color: isActive ? "var(--primary)" : "#9ca3af", flexShrink: 0 }} />
              {(isOpen || mobile) && <span style={{ flex: 1 }}>{item.name}</span>}
              {(isOpen || mobile) && item.name === "Pesanan" && actionNeededCount > 0 && (
                <span style={{ backgroundColor: "#e11d48", color: "white", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 10 }}>
                  {actionNeededCount}
                </span>
              )}
              {(!isOpen && !mobile) && item.name === "Pesanan" && actionNeededCount > 0 && (
                <span style={{ position: "absolute", top: 8, right: 8, width: 8, height: 8, backgroundColor: "#e11d48", borderRadius: "50%" }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px 10px 16px", borderTop: "1px solid #f3f4f6" }}>
        <Link
          href="/api/auth/signout"
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 12px", borderRadius: 10,
            color: "#ef4444", fontWeight: 600, fontSize: 14,
            textDecoration: "none", whiteSpace: "nowrap", overflow: "hidden",
          }}
        >
          <LogOut size={18} style={{ color: "#f87171", flexShrink: 0 }} />
          {(isOpen || mobile) && <span>Keluar Sistem</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa", display: "flex", overflow: "hidden", fontFamily: "var(--font-sans)" }}>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: isOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        style={{
          backgroundColor: "white",
          borderRight: "1px solid #f3f4f6",
          boxShadow: "2px 0 16px rgba(0,0,0,0.04)",
          display: "none",
          flexDirection: "column",
          position: "relative",
          flexShrink: 0,
          zIndex: 20,
          overflowX: "hidden",
        }}
        className="md-sidebar"
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: "absolute", right: -14, top: 24,
            width: 28, height: 28,
            background: "white",
            border: "1.5px solid #e5e7eb",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            zIndex: 30,
            color: "#9ca3af",
          }}
        >
          {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
        <SidebarContent />
      </motion.aside>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              style={{
                position: "fixed", inset: 0,
                backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
                zIndex: 40,
              }}
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              style={{
                position: "fixed", inset: 0, right: "auto",
                width: 240,
                backgroundColor: "white",
                boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                style={{
                  position: "absolute", top: 16, right: 16,
                  padding: 6, borderRadius: 8, cursor: "pointer",
                  color: "#6b7280", border: "none", background: "#f9fafb",
                }}
              >
                <X size={18} />
              </button>
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

        {/* Top Header */}
        <header style={{
          backgroundColor: "white",
          borderBottom: "1px solid #f3f4f6",
          padding: "0 28px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="mobile-menu-btn"
              style={{
                padding: 8, borderRadius: 8, cursor: "pointer",
                color: "#6b7280", border: "none", background: "transparent",
              }}
            >
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", fontFamily: "var(--font-sans)" }}>
              {pageTitle}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" style={{
              fontSize: 12, fontWeight: 700, color: "var(--primary)",
              padding: "6px 14px", borderRadius: 999,
              border: "1.5px solid #fecdd3",
              backgroundColor: "#fff1f2",
              textDecoration: "none",
            }}>
              Lihat Toko ↗
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingLeft: 16, borderLeft: "1px solid #f3f4f6" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>{userName}</p>
                <p style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Administrator
                </p>
              </div>
              <div style={{
                width: 36, height: 36,
                background: "linear-gradient(135deg, var(--primary), #c0395a)",
                color: "white", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: 14,
                flexShrink: 0,
              }}>
                {userName?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "28px 32px" }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (min-width: 768px) {
          .md-sidebar { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
