(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[974],{165:(e,r,t)=>{Promise.resolve().then(t.t.bind(t,8500,23)),Promise.resolve().then(t.bind(t,6675)),Promise.resolve().then(t.bind(t,1417)),Promise.resolve().then(t.bind(t,3948))},1417:(e,r,t)=>{"use strict";t.d(r,{default:()=>d});var a=t(5155),i=t(2115),n=t(3321),o=t(6550),s=t(6720);function l({product:e}){let r=(0,n.useRouter)(),[t,d]=(0,i.useState)(!1);return(0,a.jsxs)("div",{style:{display:"flex",gap:8,marginTop:16,paddingTop:14,borderTop:"1px solid #f3f4f6"},children:[(0,a.jsxs)("button",{onClick:()=>{try{let r=localStorage.getItem("brownis_cart"),t=r?JSON.parse(r):[];if(t.find(r=>r.id===e.id))t=t.map(r=>r.id===e.id?{...r,qty:r.qty+1}:r);else{if(t.length>=10)return void alert("Keranjang penuh! Maksimal 10 jenis produk berbeda.");t.push({id:e.id,name:e.name,price:Number(e.price),qty:1,image_url:e.image_url})}localStorage.setItem("brownis_cart",JSON.stringify(t)),d(!0),setTimeout(()=>d(!1),2e3),window.dispatchEvent(new Event("cart_updated"))}catch(e){console.error(e)}},style:{flex:1,fontSize:12,fontWeight:700,color:t?"white":"var(--primary)",backgroundColor:t?"#10b981":"transparent",border:`1.5px solid ${t?"#10b981":"var(--primary)"}`,padding:"8px 12px",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all 0.2s"},children:[(0,a.jsx)(o.A,{size:14})," ",t?"Tersimpan!":"+ Keranjang"]}),(0,a.jsxs)("button",{onClick:()=>{r.push(`/checkout?add=${e.id}&t=${Date.now()}`)},style:{flex:1,fontSize:12,fontWeight:700,color:"white",backgroundColor:"var(--primary)",border:"1.5px solid var(--primary)",padding:"8px 12px",borderRadius:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6},children:[(0,a.jsx)(s.A,{size:14})," Beli Langsung"]})]})}function d({products:e,session:r}){let[t,n]=(0,i.useState)(""),[o,s]=(0,i.useState)("none"),[p,c]=(0,i.useState)("all"),f=[...e];return t&&(f=f.filter(e=>e.name.toLowerCase().includes(t.toLowerCase()))),"long"===p?f=f.filter(e=>e.expiration_days>=7):"short"===p&&(f=f.filter(e=>e.expiration_days<7)),"asc"===o?f.sort((e,r)=>Number(e.price)-Number(r.price)):"desc"===o?f.sort((e,r)=>Number(r.price)-Number(e.price)):"sold"===o&&f.sort((e,r)=>(r.soldCount||0)-(e.soldCount||0)),(0,a.jsxs)("div",{children:[(0,a.jsxs)("div",{style:{display:"flex",gap:16,marginBottom:28,flexWrap:"wrap",justifyContent:"space-between",alignItems:"center"},children:[(0,a.jsx)("input",{type:"text",placeholder:"Cari nama produk...",value:t,onChange:e=>n(e.target.value),style:{padding:"10px 16px",borderRadius:10,border:"1.5px solid var(--border)",outline:"none",flex:1,minWidth:200,fontFamily:"var(--font-sans)",fontSize:14}}),(0,a.jsxs)("div",{style:{display:"flex",gap:12,flexWrap:"wrap",flex:1,justifyContent:"flex-end"},children:[(0,a.jsxs)("select",{value:p,onChange:e=>c(e.target.value),style:{padding:"10px 16px",borderRadius:10,border:"1.5px solid var(--border)",outline:"none",backgroundColor:"white",cursor:"pointer",fontFamily:"var(--font-sans)",fontSize:14,minWidth:200},children:[(0,a.jsx)("option",{value:"all",children:"Semua Masa Simpan"}),(0,a.jsx)("option",{value:"long",children:"Bertahan Lama (≥ 7 Hari)"}),(0,a.jsx)("option",{value:"short",children:"Cepat Basi (< 7 Hari)"})]}),(0,a.jsxs)("select",{value:o,onChange:e=>s(e.target.value),style:{padding:"10px 16px",borderRadius:10,border:"1.5px solid var(--border)",outline:"none",backgroundColor:"white",cursor:"pointer",fontFamily:"var(--font-sans)",fontSize:14,minWidth:200},children:[(0,a.jsx)("option",{value:"none",children:"Urutkan: Default"}),(0,a.jsx)("option",{value:"sold",children:"Paling Banyak Dibeli"}),(0,a.jsx)("option",{value:"asc",children:"Harga: Terendah ke Tertinggi"}),(0,a.jsx)("option",{value:"desc",children:"Harga: Tertinggi ke Terendah"})]})]})]}),0===f.length?(0,a.jsxs)("div",{style:{textAlign:"center",padding:"64px 20px",width:"100%",gridColumn:"1 / -1"},children:[(0,a.jsx)("p",{style:{fontSize:48,marginBottom:16},children:"\uD83C\uDF70"}),(0,a.jsx)("h3",{style:{fontSize:18,fontWeight:700,color:"var(--secondary)",marginBottom:8},children:"Produk Tidak Ditemukan"}),(0,a.jsx)("p",{style:{fontSize:14,color:"#9ca3af"},children:"Katalog produk saat ini sedang kosong atau tidak ada produk yang cocok dengan pencarian Anda."})]}):(0,a.jsx)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",gap:24},children:f.map(e=>(0,a.jsxs)("div",{className:"card",style:{display:"flex",flexDirection:"column"},children:[(0,a.jsxs)("div",{style:{position:"relative",overflow:"hidden",height:200,backgroundColor:"#f9fafb"},children:[(0,a.jsx)("img",{src:e.image_url||"/hero_bg.png",alt:e.name,style:{width:"100%",height:"100%",objectFit:"cover",display:"block"}}),e.is_bestseller&&(0,a.jsx)("span",{style:{position:"absolute",top:12,right:12,backgroundColor:"#f59e0b",color:"white",fontSize:10,fontWeight:700,padding:"4px 10px",borderRadius:8,letterSpacing:.5,textTransform:"uppercase"},children:"Best Seller ⭐"})]}),(0,a.jsxs)("div",{style:{padding:"20px 20px 18px",display:"flex",flexDirection:"column",flex:1},children:[(0,a.jsx)("h3",{style:{fontFamily:"var(--font-sans)",fontSize:14,fontWeight:700,color:"var(--secondary)",marginBottom:6},children:e.name}),(0,a.jsx)("p",{style:{fontSize:12,color:"#9ca3af",lineHeight:1.5,flex:1,marginBottom:12},children:e.description}),(0,a.jsx)("div",{style:{display:"flex",alignItems:"center",marginBottom:12},children:(0,a.jsxs)("span",{style:{fontSize:11,fontWeight:700,color:e.expiration_days>=7?"#059669":"#dc2626",backgroundColor:e.expiration_days>=7?"#d1fae5":"#fee2e2",padding:"4px 8px",borderRadius:6},children:["⏱️ Masa Simpan: ",e.expiration_days," Hari"]})}),(0,a.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},children:[(0,a.jsxs)("span",{style:{fontWeight:800,color:"var(--primary)",fontSize:18},children:["Rp ",Number(e.price).toLocaleString("id-ID")]}),(0,a.jsxs)("span",{style:{fontSize:11,color:"#6b7280",fontWeight:600,backgroundColor:"#f3f4f6",padding:"4px 8px",borderRadius:6},children:["Terjual ",e.soldCount||0]})]}),r?.user?.role!=="OWNER"&&(0,a.jsx)(l,{product:e})]})]},e.id))})]})}},3321:(e,r,t)=>{"use strict";var a=t(4645);t.o(a,"usePathname")&&t.d(r,{usePathname:function(){return a.usePathname}}),t.o(a,"useRouter")&&t.d(r,{useRouter:function(){return a.useRouter}}),t.o(a,"useSearchParams")&&t.d(r,{useSearchParams:function(){return a.useSearchParams}})},3948:(e,r,t)=>{"use strict";t.d(r,{default:()=>i});var a=t(5155);function i({topProducts:e}){let r=[...e,...e,...e];return(0,a.jsxs)("div",{style:{padding:"56px 0",overflow:"hidden",position:"relative",background:"linear-gradient(135deg, #1a0a0e 0%, #3b1120 40%, #6b2037 70%, #3b1120 100%)"},children:[(0,a.jsx)("style",{dangerouslySetInnerHTML:{__html:`
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
      `}}),(0,a.jsxs)("div",{style:{textAlign:"center",marginBottom:36,position:"relative",zIndex:2},children:[(0,a.jsx)("span",{style:{display:"inline-block",background:"rgba(245,158,11,0.15)",border:"1px solid rgba(245,158,11,0.35)",color:"#fcd34d",fontSize:11,fontWeight:800,padding:"5px 14px",borderRadius:999,letterSpacing:2,textTransform:"uppercase",marginBottom:12},children:"⚡ Produk Unggulan"}),(0,a.jsx)("h2",{style:{fontFamily:"var(--font-serif)",color:"#fff",fontSize:"clamp(22px, 3vw, 30px)",fontWeight:800,margin:0,textShadow:"0 2px 20px rgba(245,158,11,0.3)"},children:"\uD83D\uDD25 Sedang Tren & Paling Laku"}),(0,a.jsx)("p",{style:{fontSize:13,color:"rgba(255,255,255,0.55)",marginTop:6},children:"Produk favorit yang paling sering dipesan pelanggan minggu ini"})]}),(0,a.jsx)("div",{className:"marquee-wrapper",style:{position:"relative",overflow:"hidden"},children:(0,a.jsx)("div",{className:"marquee-inner",children:r.map((r,t)=>{let i=t%e.length+1,n=1===i?"\uD83E\uDD47":2===i?"\uD83E\uDD48":3===i?"\uD83E\uDD49":`#${i}`,o=1===i?"linear-gradient(135deg, #f59e0b, #d97706)":2===i?"linear-gradient(135deg, #9ca3af, #6b7280)":3===i?"linear-gradient(135deg, #cd7c3c, #a0522d)":"linear-gradient(135deg, #6b7280, #4b5563)";return(0,a.jsx)("div",{className:"top-card-wrap",style:{margin:"0 12px",flexShrink:0},children:(0,a.jsx)("div",{className:"top-card-floater",children:(0,a.jsx)("a",{href:"#products",style:{textDecoration:"none",display:"block"},children:(0,a.jsxs)("div",{className:"top-card-inner",children:[(0,a.jsxs)("div",{className:"top-card-img",children:[(0,a.jsx)("div",{className:"top-card-overlay"}),(0,a.jsxs)("div",{style:{position:"absolute",top:12,left:12,background:o,color:"white",padding:"4px 10px",borderRadius:999,fontSize:12,fontWeight:800,boxShadow:"0 2px 10px rgba(0,0,0,0.3)",zIndex:3,whiteSpace:"nowrap"},children:[n," #",i]}),(0,a.jsxs)("div",{style:{position:"absolute",top:12,right:12,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",color:"#fcd34d",padding:"4px 8px",borderRadius:999,fontSize:10,fontWeight:800,zIndex:3,whiteSpace:"nowrap",border:"1px solid rgba(252,211,77,0.3)"},children:["\uD83D\uDD25 ",r.soldCount," terjual"]}),(0,a.jsx)("img",{src:r.image_url||"/hero_bg.png",alt:r.name,onError:e=>{e.target.src="/hero_bg.png"}})]}),(0,a.jsxs)("div",{className:"top-card-body",children:[(0,a.jsx)("p",{className:"top-card-name",children:r.name}),(0,a.jsxs)("p",{className:"top-card-price",children:["Rp ",Number(r.price).toLocaleString("id-ID")]})]})]})})})},`${r.id}-${t}`)})})})]})}t(2115)},6550:(e,r,t)=>{"use strict";t.d(r,{A:()=>a});let a=(0,t(9537).A)("shopping-cart",[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]])},6675:(e,r,t)=>{"use strict";t.d(r,{default:()=>l});var a=t(5155),i=t(2115),n=t(8500),o=t.n(n),s=t(6720);function l(){let[e,r]=(0,i.useState)(0),t=()=>{try{let e=localStorage.getItem("brownis_cart");if(e){let t=JSON.parse(e);r(t.reduce((e,r)=>e+r.qty,0))}else r(0)}catch(e){r(0)}};return(0,i.useEffect)(()=>(t(),window.addEventListener("cart_updated",t),()=>window.removeEventListener("cart_updated",t)),[]),(0,a.jsxs)(o(),{href:"/cart",style:{position:"relative",display:"flex",alignItems:"center",color:"var(--secondary)",textDecoration:"none",marginRight:8},children:[(0,a.jsx)(s.A,{size:22}),e>0&&(0,a.jsx)("span",{style:{position:"absolute",top:-6,right:-8,backgroundColor:"var(--primary)",color:"white",fontSize:10,fontWeight:800,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid white"},children:e>99?"99+":e})]})}},6720:(e,r,t)=>{"use strict";t.d(r,{A:()=>a});let a=(0,t(9537).A)("shopping-bag",[["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}],["path",{d:"M3.103 6.034h17.794",key:"awc11p"}],["path",{d:"M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z",key:"o988cm"}]])},9537:(e,r,t)=>{"use strict";t.d(r,{A:()=>d});var a=t(2115);let i=(...e)=>e.filter((e,r,t)=>!!e&&""!==e.trim()&&t.indexOf(e)===r).join(" ").trim(),n=e=>{let r=e.replace(/^([A-Z])|[\s-_]+(\w)/g,(e,r,t)=>t?t.toUpperCase():r.toLowerCase());return r.charAt(0).toUpperCase()+r.slice(1)};var o={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};let s=(0,a.createContext)({}),l=(0,a.forwardRef)(({color:e,size:r,strokeWidth:t,absoluteStrokeWidth:n,className:l="",children:d,iconNode:p,...c},f)=>{let{size:u=24,strokeWidth:g=2,absoluteStrokeWidth:h=!1,color:x="currentColor",className:m=""}=(0,a.useContext)(s)??{},b=n??h?24*Number(t??g)/Number(r??u):t??g;return(0,a.createElement)("svg",{ref:f,...o,width:r??u??o.width,height:r??u??o.height,stroke:e??x,strokeWidth:b,className:i("lucide",m,l),...!d&&!(e=>{for(let r in e)if(r.startsWith("aria-")||"role"===r||"title"===r)return!0;return!1})(c)&&{"aria-hidden":"true"},...c},[...p.map(([e,r])=>(0,a.createElement)(e,r)),...Array.isArray(d)?d:[d]])}),d=(e,r)=>{let t=(0,a.forwardRef)(({className:t,...o},s)=>(0,a.createElement)(l,{ref:s,iconNode:r,className:i(`lucide-${n(e).replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase()}`,`lucide-${e}`,t),...o}));return t.displayName=n(e),t}}},e=>{e.O(0,[500,441,794,358],()=>e(e.s=165)),_N_E=e.O()}]);