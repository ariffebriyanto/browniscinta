'use client';

import React, { useRef, useState } from 'react';

export default function TopProductsSlider({ topProducts }: { topProducts: any[] }) {
  const displayItems = [...topProducts, ...topProducts, ...topProducts];

  return (
    <div style={{ padding: "56px 0", overflow: "hidden", position: "relative", background: "linear-gradient(135deg, #1a0a0e 0%, #3b1120 40%, #6b2037 70%, #3b1120 100%)" }}>

      <style dangerouslySetInnerHTML={{ __html: `
        /* Subtle sparkle particles */
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
          50% { transform: translateY(-20px) scale(1.2); opacity: 0.8; }
        }

        /* Main marquee movement */
        @keyframes scroll-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }

        /* Each card floats up and down at different timings */
        @keyframes card-float-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes card-float-2 {
          0%, 100% { transform: translateY(-6px); }
          50% { transform: translateY(4px); }
        }
        @keyframes card-float-3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
        @keyframes card-float-4 {
          0%, 100% { transform: translateY(-4px); }
          50% { transform: translateY(8px); }
        }
        @keyframes card-float-5 {
          0%, 100% { transform: translateY(-8px); }
          50% { transform: translateY(2px); }
        }
        @keyframes card-float-6 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        /* Badge shimmer */
        @keyframes badge-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        /* Glowing pulse on rank-1 card */
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 18px rgba(245,158,11,0.4), 0 8px 32px rgba(139,28,49,0.3); }
          50% { box-shadow: 0 0 36px rgba(245,158,11,0.7), 0 12px 40px rgba(139,28,49,0.5); }
        }

        /* Fade edges */
        .marquee-wrapper::before, .marquee-wrapper::after {
          content: "";
          position: absolute;
          top: 0; height: 100%; width: 120px; z-index: 5; pointer-events: none;
        }
        .marquee-wrapper::before {
          left: 0;
          background: linear-gradient(to right, #1a0a0e, transparent);
        }
        .marquee-wrapper::after {
          right: 0;
          background: linear-gradient(to left, #1a0a0e, transparent);
        }

        /* Marquee scroll + pause on hover */
        .marquee-inner {
          display: flex;
          width: fit-content;
          animation: scroll-marquee 30s linear infinite;
        }
        .marquee-inner:hover {
          animation-play-state: paused;
        }

        /* Float animations per nth-card cycling 6 patterns */
        .top-card-wrap:nth-child(6n+1) .top-card-floater { animation: card-float-1 3.8s ease-in-out infinite; }
        .top-card-wrap:nth-child(6n+2) .top-card-floater { animation: card-float-2 4.2s ease-in-out infinite; }
        .top-card-wrap:nth-child(6n+3) .top-card-floater { animation: card-float-3 3.5s ease-in-out infinite; }
        .top-card-wrap:nth-child(6n+4) .top-card-floater { animation: card-float-4 4.6s ease-in-out infinite; }
        .top-card-wrap:nth-child(6n+5) .top-card-floater { animation: card-float-5 3.2s ease-in-out infinite; }
        .top-card-wrap:nth-child(6n+6) .top-card-floater { animation: card-float-6 4.9s ease-in-out infinite; }

        .top-card-inner {
          width: 240px;
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: border-color 0.3s ease;
          position: relative;
        }
        .top-card-inner:hover {
          border-color: rgba(245,158,11,0.6);
          animation: glow-pulse 1.5s ease-in-out infinite;
        }
        .top-card-img {
          position: relative;
          height: 170px;
          overflow: hidden;
        }
        .top-card-img img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.5s ease;
          filter: brightness(0.85);
        }
        .top-card-inner:hover .top-card-img img {
          transform: scale(1.1);
          filter: brightness(1);
        }
        .top-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(26,10,14,0.8) 0%, transparent 50%);
        }
        .rank-badge {
          position: absolute; top: 12px; left: 12px;
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          background-size: 200% auto;
          animation: badge-shimmer 3s linear infinite;
          color: white;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 2px 10px rgba(245,158,11,0.5);
          z-index: 3;
          white-space: nowrap;
        }
        .top-card-body {
          padding: 14px 16px 18px;
        }
        .top-card-name {
          font-size: 14px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .top-card-price {
          font-size: 15px;
          font-weight: 900;
          color: #fcd34d;
        }
      `}} />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36, position: "relative", zIndex: 2 }}>
        <span style={{ display: "inline-block", background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)", color: "#fcd34d", fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 999, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
          ⚡ Produk Unggulan
        </span>
        <h2 style={{ fontFamily: "var(--font-serif)", color: "#fff", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 800, margin: 0, textShadow: "0 2px 20px rgba(245,158,11,0.3)" }}>
          🔥 Sedang Tren & Paling Laku
        </h2>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
          Produk favorit yang paling sering dipesan pelanggan minggu ini
        </p>
      </div>

      {/* Slider */}
      <div className="marquee-wrapper" style={{ position: "relative", overflow: "hidden" }}>
        <div className="marquee-inner">
          {displayItems.map((product, index) => {
            const rank = (index % topProducts.length) + 1;
            const rankMedal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            const rankBg = rank === 1
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : rank === 2
              ? 'linear-gradient(135deg, #9ca3af, #6b7280)'
              : rank === 3
              ? 'linear-gradient(135deg, #cd7c3c, #a0522d)'
              : 'linear-gradient(135deg, #6b7280, #4b5563)';
            return (
            <div className="top-card-wrap" key={`${product.id}-${index}`} style={{ margin: "0 12px", flexShrink: 0 }}>
              <div className="top-card-floater">
                <a href="#products" style={{ textDecoration: "none", display: "block" }}>
                  <div className="top-card-inner">
                    <div className="top-card-img">
                      <div className="top-card-overlay" />
                      {/* Rank badge top-left */}
                      <div style={{ position: "absolute", top: 12, left: 12, background: rankBg, color: "white", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 800, boxShadow: "0 2px 10px rgba(0,0,0,0.3)", zIndex: 3, whiteSpace: "nowrap" }}>
                        {rankMedal} #{rank}
                      </div>
                      {/* Sold badge top-right */}
                      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", color: "#fcd34d", padding: "4px 8px", borderRadius: 999, fontSize: 10, fontWeight: 800, zIndex: 3, whiteSpace: "nowrap", border: "1px solid rgba(252,211,77,0.3)" }}>
                        🔥 {product.soldCount} terjual
                      </div>
                      <img
                        src={product.image_url || "/hero_bg.png"}
                        alt={product.name}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/hero_bg.png"; }}
                      />
                    </div>
                    <div className="top-card-body">
                      <p className="top-card-name">{product.name}</p>
                      <p className="top-card-price">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}
