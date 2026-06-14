"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendWhatsappText } from "@/lib/whatsapp";

export async function updateOrderStatus(id: string, status: string, shipping_resi?: string) {
  try {
    const data: any = { status };
    if (shipping_resi !== undefined) {
      data.shipping_resi = shipping_resi;
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
        case "APPROVED":
          waMessage = `Halo ${order.user.name},\n\nPembayaran untuk pesanan *${id}* telah kami terima dan sedang diproses. Terima kasih! 🥳\n\n- Brownis Cinta`;
          break;
        case "SHIPPED":
          if (shipping_resi) {
            waMessage = `Halo ${order.user.name},\n\nPesanan *${id}* Anda telah dikirim! 🚀\nResi Pengiriman: *${shipping_resi}*\nSilakan lacak pengiriman Anda. Terima kasih!\n\n- Brownis Cinta`;
          } else {
            waMessage = `Halo ${order.user.name},\n\nPesanan *${id}* Anda siap untuk diambil atau sedang dalam perjalanan! 🚀\n\n- Brownis Cinta`;
          }
          break;
        case "CANCELLED":
          waMessage = `Halo ${order.user.name},\n\nMohon maaf, pesanan *${id}* Anda telah dibatalkan.\nJika ada pertanyaan, silakan hubungi kami.\n\n- Brownis Cinta`;
          break;
      }
      
      if (waMessage) {
        // We don't await this so it doesn't block the UI response
        sendWhatsappText(order.user.phone, waMessage).catch(err => console.error("WA Send Error:", err));
      }
    }

    revalidatePath("/owner/orders");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
