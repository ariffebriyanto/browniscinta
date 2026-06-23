import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerDashboardClient from "./CustomerDashboardClient";
import { cancelExpiredOrders } from "./actions";

export default async function CustomerDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Auto-cancel any expired PENDING orders before rendering
  await cancelExpiredOrders();

  // Fetch customer orders from database
  const userId = parseInt((session.user as any).id);
  const orders = await prisma.order.findMany({
    where: { user_id: userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const serializedOrders = orders.map((o) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    total_price: Number(o.total_price),
    status: o.status,
    shipping_cost: Number(o.shipping_cost),
    shipping_service: o.shipping_service || null,
    shipping_resi: o.shipping_resi || null,
    payment_proof: o.payment_proof || null,
    payment_deadline: o.payment_deadline ? o.payment_deadline.toISOString() : null,
    refund_account: o.refund_account || null,
    items: o.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: Number(item.price),
      product: {
        id: item.product.id,
        name: item.product.name,
        image_url: item.product.image_url || null,
      },
    })),
  }));

  return (
    <CustomerDashboardClient
      userName={session.user?.name || "Customer"}
      orders={serializedOrders}
    />
  );
}
