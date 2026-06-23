"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { sendWhatsappText } from "@/lib/whatsapp";

// Payment window in milliseconds (Disetting 7 menit sesuai permintaan)
const PAYMENT_WINDOW_MS = 7 * 60 * 1000; // 7 menit

export async function uploadPaymentProof(orderId: string, formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) {
      return { error: "Tidak ada file yang diunggah" };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${Date.now()}-${cleanFileName}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    await writeFile(filePath, buffer);
    const paymentProofUrl = `/uploads/${uniqueFileName}`;

    // Update order status to PAID and save payment proof
    await prisma.order.update({
      where: { id: orderId },
      data: {
        payment_proof: paymentProofUrl,
        status: "PAID",
      },
    });

    revalidatePath("/customer/dashboard");
    revalidatePath("/owner/orders");
    revalidatePath("/owner/dashboard");
    return { success: true, paymentProofUrl };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function confirmDelivery(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED" },
    });
    revalidatePath("/customer/dashboard");
    revalidatePath("/owner/orders");
    revalidatePath("/owner/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createOrder(data: {
  userId: number;
  totalPrice: number;
  shippingCost: number;
  shippingService: string;
  items: { productId: number; quantity: number; price: number }[];
}) {
  try {
    const deadline = new Date(Date.now() + PAYMENT_WINDOW_MS);

    // Snapshot modal price for each item based on total quantity in this order
    const totalBox = data.items.reduce((sum, item) => sum + item.quantity, 0);
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, resellerPrice1: true, resellerPrice2: true, resellerPrice3: true, price: true },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const itemsWithModal = data.items.map((item) => {
      const product = productMap.get(item.productId);
      let modalPrice = 0;
      if (product) {
        if (totalBox > 20) modalPrice = product.resellerPrice3;
        else if (totalBox >= 10) modalPrice = product.resellerPrice2;
        else modalPrice = product.resellerPrice1;
      }
      // Fallback to percentage if modal not set
      if (modalPrice === 0) {
        const multiplier = totalBox > 20 ? 0.80 : totalBox >= 10 ? 0.85 : 0.875;
        modalPrice = Math.round(Number(item.price) * multiplier);
      }
      return { ...item, modalPrice };
    });

    const order = await prisma.order.create({
      data: {
        user_id: data.userId,
        total_price: data.totalPrice,
        shipping_cost: data.shippingCost,
        shipping_service: data.shippingService,
        status: "AWAITING",
        payment_deadline: null,
        items: {
          create: itemsWithModal.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
            price: item.price,
            modal_price: item.modalPrice,
          })),
        },
      },
      include: { user: true },
    });

    // Send WA Notification to Owner ONLY (customer doesn't pay yet)
    if (order.user?.phone) {
      const formattedTotal = `Rp ${Number(data.totalPrice).toLocaleString("id-ID")}`;
      const adminPhone = "6281282386336"; // Nomor Admin / Owner
      const adminMsg = `🛒 *PESANAN BARU MASUK!* 🛒\n\nOrder ID: #${order.id.slice(-6).toUpperCase()}\nDari: ${order.user.name} (${order.user.phone})\nTotal: *${formattedTotal}*\nPengiriman: ${data.shippingService}\n\n⚠️ Silakan cek ketersediaan stok, lalu konfirmasi di Dashboard Owner.\n(Pesanan akan auto-cancel dalam 2 hari jika tidak dikonfirmasi)`;
      await sendWhatsappText(adminPhone, adminMsg).catch(console.error);
    }

    revalidatePath("/customer/dashboard");
    revalidatePath("/owner/orders");
    revalidatePath("/owner/dashboard");
    return { success: true, orderId: order.id };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Cancel all PENDING orders whose payment_deadline has passed.
 * Called server-side on every dashboard page load.
 */
export async function cancelExpiredOrders() {
  try {
    const now = new Date();
    const result = await prisma.order.updateMany({
      where: {
        status: "PENDING",
        payment_deadline: { lt: now },
      },
      data: { status: "CANCELLED" },
    });
    if (result.count > 0) {
      revalidatePath("/customer/dashboard");
      revalidatePath("/owner/orders");
      revalidatePath("/owner/dashboard");
    }
    return { cancelled: result.count };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Cancel a single order on demand (e.g., from countdown timer expiry in browser).
 */
export async function cancelOrder(orderId: string) {
  try {
    await prisma.order.updateMany({
      where: { id: orderId, status: { in: ["PENDING", "AWAITING"] } },
      data: { status: "CANCELLED" },
    });
    revalidatePath("/customer/dashboard");
    revalidatePath("/owner/orders");
    revalidatePath("/owner/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function submitRefundAccount(orderId: string, accountDetails: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        refund_account: accountDetails,
        status: "REFUND_PENDING",
      },
    });
    revalidatePath("/customer/dashboard");
    revalidatePath("/owner/orders");
    revalidatePath("/owner/dashboard");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
