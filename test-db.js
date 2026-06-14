const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Set deadline 2 menit dari sekarang untuk semua PENDING order yang belum ada deadline
  const deadline = new Date(Date.now() + 2 * 60 * 1000);
  const result = await prisma.order.updateMany({
    where: { status: 'PENDING', payment_deadline: null },
    data: { payment_deadline: deadline }
  });
  console.log('Updated', result.count, 'orders dengan deadline 2 menit:', deadline.toISOString());

  // Lihat semua order pending
  const pending = await prisma.order.findMany({
    where: { status: 'PENDING' },
    select: { id: true, payment_deadline: true }
  });
  console.log('Pending orders:', JSON.stringify(pending, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
