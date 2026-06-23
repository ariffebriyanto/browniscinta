"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendWhatsappText } from "@/lib/whatsapp";

// Auto-cancel AWAITING orders older than 2 days
export async function autoCancelAwaitingOrders() {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const expiredOrders = await prisma.order.findMany({
    where: { status: "AWAITING", createdAt: { lt: twoDaysAgo } },
    include: { user: true },
  });
  for (const order of expiredOrders) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    if (order.user?.phone) {
      const msg = `Halo ${order.user.name}, mohon maaf pesanan #${order.id.slice(-6).toUpperCase()} kami batalkan secara otomatis karena stok tidak tersedia dalam 2 hari. Silakan pesan kembali jika masih berminat. - Brownis Cinta`;
      sendWhatsappText(order.user.phone, msg).catch(console.error);
    }
  }
  revalidatePath("/owner/orders");
}

// Owner confirms stock is available → change AWAITING to PENDING and notify customer
export async function confirmStock(id: string) {
  try {
    const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours to pay
    const deadline = new Date(Date.now() + PAYMENT_WINDOW_MS);

    const order = await prisma.order.update({
      where: { id },
      data: { status: "PENDING", payment_deadline: deadline },
      include: { user: true },
    });

    if (order.user?.phone) {
      const formattedTotal = `Rp ${Number(order.total_price).toLocaleString("id-ID")}`;
      const customerMsg = `Silahkan selesaikan transaksi anda no invoic ${order.id.slice(-6).toUpperCase()} sebesar ${formattedTotal}\nke rekening 2140639403 bca a/n arif febriyanto\njika sudah bisa kirimkan bukti pembayaran pada aplikasi https://browniscinta.al-amin-sby.web.id/\nterima kasih`;
      await sendWhatsappText(order.user.phone, customerMsg).catch(console.error);
    }

    revalidatePath("/owner/orders");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateOrderStatus(id: string, status: string, shipping_resi?: string) {
  try {
    const data: any = { status };
    if (shipping_resi !== undefined) {
      data.shipping_resi = shipping_resi;
    }
    
    // Set payment deadline if status is changed to PENDING manually
    if (status === "PENDING") {
      const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000;
      data.payment_deadline = new Date(Date.now() + PAYMENT_WINDOW_MS);
    }

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { user: true },
    });
    
    // Send WA notification based on status
    if (order.user && order.user.phone) {
      let waMessage = "";
      switch (status) {
        case "PENDING":
          const formattedTotal = `Rp ${Number(order.total_price).toLocaleString("id-ID")}`;
          waMessage = `Silahkan selesaikan transaksi anda no invoic ${id.slice(-6).toUpperCase()} sebesar ${formattedTotal}\nke rekening 2140639403 bca a/n arif febriyanto\njika sudah bisa kirimkan bukti pembayaran pada aplikasi https://browniscinta.al-amin-sby.web.id/\nterima kasih`;
          break;
        case "APPROVED":
          waMessage = `status pembayaran no invoice ${id.slice(-6).toUpperCase()} sudah di approved`;
          break;
        case "SHIPPED":
          const shortIdShipped = id.slice(-6).toUpperCase();
          if (shipping_resi) {
            waMessage = `Halo ${order.user.name},\n\nPesanan *#${shortIdShipped}* Anda telah dikirim! 🚀\nResi Pengiriman: *${shipping_resi}*\nSilakan lacak pengiriman Anda. Terima kasih!\n\n- Brownis Cinta`;
          } else {
            waMessage = `Halo ${order.user.name},\n\nPesanan *#${shortIdShipped}* Anda siap untuk diambil atau sedang dalam perjalanan! 🚀\n\n- Brownis Cinta`;
          }
          break;
        case "CANCELLED":
          waMessage = `Halo ${order.user.name},\n\nMohon maaf, pesanan *#${id.slice(-6).toUpperCase()}* Anda telah dibatalkan.\nJika ada pertanyaan, silakan hubungi kami.\n\n- Brownis Cinta`;
          break;
      }
      
      if (waMessage) {
        // Must await in Server Actions so it doesn't get cancelled before sending
        await sendWhatsappText(order.user.phone, waMessage).catch(err => console.error("WA Send Error:", err));
      }
    }

    revalidatePath("/owner/orders");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
