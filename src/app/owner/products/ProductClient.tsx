"use client";

import { useState, useMemo, useEffect } from "react";
import { createProduct, updateProduct, deleteProduct, uploadProductImage, updateProductOrder } from "./actions";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const s = {
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    border: "1px solid #f3f4f6",
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    overflow: "hidden" as const,
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "var(--font-sans)",
    outline: "none",
    backgroundColor: "#f9fafb",
    color: "#111827",
    boxSizing: "border-box" as const,
    transition: "border-color 0.15s",
  } as React.CSSProperties,
};

function SortableProductRow({ p, openModal, handleDelete, searchQuery }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id, disabled: searchQuery !== "" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderBottom: "1px solid #f9fafb",
    backgroundColor: isDragging ? "#f3f4f6" : "white",
    position: isDragging ? "relative" as const : "static" as const,
    zIndex: isDragging ? 10 : 0,
    boxShadow: isDragging ? "0 10px 20px rgba(0,0,0,0.1)" : "none",
  };

  return (
    <tr ref={setNodeRef} style={style}>
      {/* Name */}
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, overflow: "hidden",
            border: "1px solid #f3f4f6", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: "#fef2f2",
          }}>
            {p.image_url
              ? <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <span style={{ fontSize: 18 }}>🍰</span>
            }
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{p.name}</p>
            {p.description && (
              <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.description}
              </p>
            )}
          </div>
        </div>
      </td>
      {/* Price */}
      <td style={{ padding: "14px 20px" }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
          Rp {Number(p.price).toLocaleString("id-ID")}
        </span>
      </td>
      {/* Stock */}
      <td style={{ padding: "14px 20px" }}>
        <span style={{
          display: "inline-block", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700,
          backgroundColor: p.stock === 0 ? "#fef2f2" : p.stock < 10 ? "#fffbeb" : "#f0fdf4",
          color: p.stock === 0 ? "#dc2626" : p.stock < 10 ? "#d97706" : "#16a34a",
          border: `1px solid ${p.stock === 0 ? "#fecaca" : p.stock < 10 ? "#fde68a" : "#bbf7d0"}`,
        }}>
          {p.stock === 0 ? "Habis" : `${p.stock} pcs`}
        </span>
      </td>
      {/* Best Seller */}
      <td style={{ padding: "14px 20px" }}>
        {p.is_bestseller
          ? <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>⭐ Best Seller</span>
          : <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, backgroundColor: "#f9fafb", color: "#9ca3af", border: "1px solid #f3f4f6" }}>Tidak</span>
        }
      </td>
      {/* Urutan (Drag Handle) */}
      <td style={{ padding: "14px 20px" }}>
        <div 
          {...attributes} 
          {...listeners} 
          title={searchQuery !== "" ? "Kosongkan pencarian untuk mengubah urutan" : "Tahan dan geser untuk mengubah urutan"}
          style={{ 
            cursor: searchQuery !== "" ? "not-allowed" : "grab", 
            color: searchQuery !== "" ? "#d1d5db" : "#9ca3af", 
            display: "inline-flex", 
            padding: "8px", 
            borderRadius: "8px",
            backgroundColor: searchQuery !== "" ? "transparent" : "#f3f4f6",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </div>
      </td>
      {/* Actions */}
      <td style={{ padding: "14px 20px" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() => openModal(p)}
            title="Edit"
            style={{ padding: "6px 10px", borderRadius: 8, border: "none", backgroundColor: "#eff6ff", color: "#2563eb", cursor: "pointer", fontSize: 14 }}
          >✏️</button>
          <button
            onClick={() => handleDelete(p.id)}
            title="Hapus"
            style={{ padding: "6px 10px", borderRadius: 8, border: "none", backgroundColor: "#fef2f2", color: "#dc2626", cursor: "pointer", fontSize: 14 }}
          >🗑️</button>
        </div>
      </td>
    </tr>
  );
}

export default function ProductClient({ products }: { products: any[] }) {
  const [localProducts, setLocalProducts] = useState(products);

  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", stock: "",
    image_url: "", is_bestseller: "false", expiration_days: "3",
    resellerPrice1: "0", resellerPrice2: "0", resellerPrice3: "0",
  });
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localProducts.findIndex(item => item.id === active.id);
      const newIndex = localProducts.findIndex(item => item.id === over.id);
      
      const newItems = arrayMove(localProducts, oldIndex, newIndex);
      setLocalProducts(newItems);
      
      // Save to DB outside of the setState updater
      const updates = newItems.map((p, i) => ({
        id: p.id,
        display_order: i,
      }));
      
      updateProductOrder(updates).catch(console.error);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return localProducts;
    const q = searchQuery.toLowerCase();
    return localProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [localProducts, searchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert("Ukuran file maksimal 2MB"); return; }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openModal = (product?: any) => {
    setSelectedFile(null);
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name, description: product.description || "",
        price: product.price.toString(), stock: product.stock.toString(),
        image_url: product.image_url || "", is_bestseller: product.is_bestseller ? "true" : "false",
        expiration_days: product.expiration_days?.toString() || "3",
        resellerPrice1: product.resellerPrice1?.toString() || "0",
        resellerPrice2: product.resellerPrice2?.toString() || "0",
        resellerPrice3: product.resellerPrice3?.toString() || "0",
      });
      setPreviewUrl(product.image_url || "");
    } else {
      setEditingId(null);
      setFormData({ 
        name: "", description: "", price: "", stock: "", image_url: "", is_bestseller: "false", expiration_days: "3",
        resellerPrice1: "0", resellerPrice2: "0", resellerPrice3: "0"
      });
      setPreviewUrl("");
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let imageUrl = formData.image_url;
    if (selectedFile) {
      const fd = new FormData();
      fd.append("file", selectedFile);
      const r = await uploadProductImage(fd);
      if (r.success && r.imageUrl) imageUrl = r.imageUrl;
      else { alert("Gagal upload gambar"); setLoading(false); return; }
    }
    if (editingId) await updateProduct(editingId, { ...formData, image_url: imageUrl });
    else await createProduct({ ...formData, image_url: imageUrl });
    setLoading(false);
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Hapus produk ini?")) await deleteProduct(id);
  };

  return (
    <>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 700, color: "var(--secondary)", marginBottom: 4 }}>
            Daftar Produk
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-light)" }}>
            Kelola data produk dan dessert lumer yang dijual di etalase
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", flexGrow: 1, justifyContent: "flex-end" }}>
          <input 
            type="text" 
            placeholder="Cari nama produk..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...s.input, maxWidth: 300 }}
          />
          <button
            onClick={() => openModal()}
            style={{
              backgroundColor: "var(--primary)", color: "white",
              padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 700,
              border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
              boxShadow: "0 4px 12px rgba(139,28,49,0.25)", flexShrink: 0,
            }}
          >
            + Tambah Produk
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ ...s.card }}>
        <div style={{ overflowX: "auto" }}>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={filteredProducts.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #f3f4f6" }}>
                    {["Nama Produk", "Harga", "Stok", "Best Seller", "Urutan", "Aksi"].map((h) => (
                      <th key={h} style={{
                        padding: "12px 20px", textAlign: "left",
                        fontSize: 11, fontWeight: 700, color: "#9ca3af",
                        textTransform: "uppercase", letterSpacing: 0.8,
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <SortableProductRow 
                      key={p.id} 
                      p={p} 
                      openModal={openModal} 
                      handleDelete={handleDelete} 
                      searchQuery={searchQuery}
                    />
                  ))}

                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center" }}>
                        <p style={{ fontSize: 36, marginBottom: 12 }}>🍰</p>
                        <p style={{ fontSize: 14, color: "#9ca3af", fontWeight: 600 }}>Belum ada produk. Klik tombol "Tambah Produk" untuk memulai.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
                width: "100%", maxWidth: 520,
                boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column",
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: "20px 28px", borderBottom: "1px solid #f3f4f6",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                backgroundColor: "#fafafa",
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                  {editingId ? "✏️ Edit Produk" : "➕ Tambah Produk Baru"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: "#f3f4f6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
                >×</button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
                <form id="productForm" onSubmit={handleSubmit}>
                  <div style={{ display: "grid", gap: 16 }}>

                    {/* Name */}
                    <div>
                      <label style={s.label}>Nama Produk *</label>
                      <input
                        type="text" required style={s.input}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nama produk..."
                        onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label style={s.label}>Deskripsi</label>
                      <textarea
                        rows={2} style={{ ...s.input, resize: "none" as const }}
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Deskripsi singkat produk..."
                        onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                        onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                      />
                    </div>

                    {/* Price + Stock */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={s.label}>Harga (Rp) *</label>
                        <input
                          type="number" required style={s.input}
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="25000"
                          onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                        />
                      </div>
                      <div>
                        <label style={s.label}>Stok *</label>
                        <input
                          type="number" required style={s.input}
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          placeholder="100"
                          onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                        />
                      </div>
                      <div>
                        <label style={s.label}>Masa Expired (Hari) *</label>
                        <input
                          type="number" required style={s.input}
                          value={formData.expiration_days}
                          onChange={(e) => setFormData({ ...formData, expiration_days: e.target.value })}
                          placeholder="3"
                          min="1"
                          onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
                          onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
                        />
                      </div>
                    </div>
                    
                    <div style={{ padding: 16, backgroundColor: "#fdf4ff", borderRadius: 12, border: "1px dashed #fbcfe8" }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#be185d", marginBottom: 12 }}>💰 Harga Modal / Beli Reseller</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        <div>
                          <label style={{ ...s.label, color: "#9d174d", fontSize: 11 }}>Modal &lt; 10 Box</label>
                          <input
                            type="number" required style={{ ...s.input, borderColor: "#fbcfe8", backgroundColor: "white" }}
                            value={formData.resellerPrice1}
                            onChange={(e) => setFormData({ ...formData, resellerPrice1: e.target.value })}
                            placeholder="33250"
                          />
                        </div>
                        <div>
                          <label style={{ ...s.label, color: "#9d174d", fontSize: 11 }}>Modal 10-20 Box</label>
                          <input
                            type="number" required style={{ ...s.input, borderColor: "#fbcfe8", backgroundColor: "white" }}
                            value={formData.resellerPrice2}
                            onChange={(e) => setFormData({ ...formData, resellerPrice2: e.target.value })}
                            placeholder="32300"
                          />
                        </div>
                        <div>
                          <label style={{ ...s.label, color: "#9d174d", fontSize: 11 }}>Modal &gt; 20 Box</label>
                          <input
                            type="number" required style={{ ...s.input, borderColor: "#fbcfe8", backgroundColor: "white" }}
                            value={formData.resellerPrice3}
                            onChange={(e) => setFormData({ ...formData, resellerPrice3: e.target.value })}
                            placeholder="30400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label style={s.label}>Gambar Produk</label>
                      {!previewUrl ? (
                        <label style={{
                          display: "flex", flexDirection: "column", alignItems: "center",
                          justifyContent: "center", gap: 8,
                          border: "2px dashed #e5e7eb", borderRadius: 12,
                          padding: "24px 16px", cursor: "pointer",
                          backgroundColor: "#f9fafb",
                        }}>
                          <span style={{ fontSize: 32 }}>📷</span>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>
                            <span style={{ color: "var(--primary)", fontWeight: 700 }}>Klik untuk upload</span> atau seret file
                          </p>
                          <p style={{ fontSize: 11, color: "#9ca3af" }}>PNG, JPG, WEBP (Maks. 2MB)</p>
                          <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                        </label>
                      ) : (
                        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", height: 120 }}>
                          <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          <button
                            type="button"
                            onClick={() => { setSelectedFile(null); setPreviewUrl(""); setFormData(f => ({ ...f, image_url: "" })); }}
                            style={{
                              position: "absolute", top: 8, right: 8,
                              background: "#dc2626", color: "white", border: "none",
                              borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 12, fontWeight: 700,
                            }}
                          >Hapus</button>
                        </div>
                      )}
                    </div>

                    {/* Best Seller */}
                    <div>
                      <label style={s.label}>Tampil sebagai Best Seller?</label>
                      <select
                        style={{ ...s.input }}
                        value={formData.is_bestseller}
                        onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.value })}
                      >
                        <option value="false">Tidak</option>
                        <option value="true">Ya — Tampilkan label Best Seller ⭐</option>
                      </select>
                    </div>

                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: "16px 28px", borderTop: "1px solid #f3f4f6",
                display: "flex", justifyContent: "flex-end", gap: 12,
                backgroundColor: "#fafafa",
              }}>
                <button
                  type="button" onClick={() => setIsModalOpen(false)}
                  style={{ padding: "10px 20px", borderRadius: 10, border: "1.5px solid #e5e7eb", backgroundColor: "white", fontSize: 14, fontWeight: 700, color: "#374151", cursor: "pointer" }}
                >
                  Batal
                </button>
                <button
                  type="submit" form="productForm" disabled={loading}
                  style={{
                    padding: "10px 24px", borderRadius: 10, border: "none",
                    backgroundColor: loading ? "#9ca3af" : "var(--primary)",
                    color: "white", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(139,28,49,0.2)",
                  }}
                >
                  {loading ? "Menyimpan..." : "💾 Simpan Produk"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
