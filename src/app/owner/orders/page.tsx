import { prisma } from "@/lib/prisma";
import OrderClient from "./OrderClient";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, phone: true } },
    },
  });

  const serializedOrders = orders.map((o) => ({
    ...o,
    total_price: Number(o.total_price),
    shipping_cost: Number(o.shipping_cost),
  }));

  return <OrderClient orders={serializedOrders} />;
}
