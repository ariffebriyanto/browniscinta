import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function OwnerDashboardPage({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const filter = params?.filter || "all";

  // 1. Basic Stats
  const totalUsers = await prisma.user.count({ where: { role: "CUSTOMER" } });
  const totalProducts = await prisma.product.count();
  const totalOrders = await prisma.order.count();

  // 2. Total Revenue (only count valid paid orders)
  const orders = await prisma.order.findMany({
    where: { 
      status: { in: ["PAID", "APPROVED", "SHIPPED", "COMPLETED"] } 
    },
    select: { 
      total_price: true, 
      status: true, 
      createdAt: true,
      items: {
        select: {
          quantity: true,
          price: true,
          modal_price: true,
        }
      }
    },
  });

  // Filter orders for summary cards
  const now = new Date();
  let summaryOrders = orders;
  
  if (filter === "today") {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    summaryOrders = orders.filter(o => new Date(o.createdAt) >= startOfDay);
  } else if (filter === "this_month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    summaryOrders = orders.filter(o => new Date(o.createdAt) >= startOfMonth);
  }

  let totalRevenue = 0;
  let totalMargin = 0;

  for (const o of summaryOrders) {
    totalRevenue += Number(o.total_price);
    
    let invoiceMargin = 0;
    
    for (const item of o.items) {
      const modalPrice = Number(item.modal_price) || 0;
      const itemCogs = modalPrice * item.quantity;
      const itemRevenue = Number(item.price) * item.quantity;
      invoiceMargin += (itemRevenue - itemCogs);
    }
    
    totalMargin += invoiceMargin;
  }

  // 3. Status Counts for pie/donut chart
  const statusCounts = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const statusMap = statusCounts.reduce((map, item) => {
    map[item.status] = item._count.id;
    return map;
  }, {} as Record<string, number>);

  // 4. Monthly Trend (last 6 months)
  const monthlySales: Record<string, number> = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  
  // Initialize last 6 months with 0
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    monthlySales[label] = 0;
  }

  // Populate monthly sales
  for (const o of orders) {
    const date = new Date(o.createdAt);
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    if (monthlySales[label] !== undefined) {
      monthlySales[label] += Number(o.total_price);
    }
  }

  const salesTrend = Object.entries(monthlySales).map(([month, amount]) => ({
    month,
    amount,
  }));

  // 5. Top Selling Products
  const orderItems = await prisma.orderItem.findMany({
    include: {
      product: { select: { name: true } },
    },
  });

  const productSalesMap: Record<string, number> = {};
  for (const item of orderItems) {
    const pName = item.product.name;
    productSalesMap[pName] = (productSalesMap[pName] || 0) + item.quantity;
  }

  const topProducts = Object.entries(productSalesMap)
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <DashboardClient
      currentFilter={filter}
      stats={{
        totalUsers,
        totalProducts,
        totalOrders: summaryOrders.length,
        totalRevenue,
        totalMargin,
      }}
      statusDistribution={{
        PENDING: statusMap["PENDING"] || 0,
        PAID: statusMap["PAID"] || 0,
        APPROVED: statusMap["APPROVED"] || 0,
        SHIPPED: statusMap["SHIPPED"] || 0,
        COMPLETED: statusMap["COMPLETED"] || 0,
        CANCELLED: statusMap["CANCELLED"] || 0,
      }}
      salesTrend={salesTrend}
      topProducts={topProducts}
    />
  );
}
