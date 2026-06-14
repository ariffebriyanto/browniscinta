import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Owner
  const ownerPassword = await bcrypt.hash("owner123", 10);
  const owner = await prisma.user.upsert({
    where: { phone: "08111111111" },
    update: {},
    create: {
      name: "Owner Brownis Cinta",
      phone: "08111111111",
      password_hash: ownerPassword,
      role: "OWNER",
      address: "Kantor Pusat Brownis Cinta",
    },
  });
  console.log(`Owner created: ${owner.name} (Phone: ${owner.phone})`);

  // Create some products
  const products = [
    {
      name: "Dessert Lumer Mini Size",
      description: "Choco Delight / Cookies & Cream / Say Cheese / Tiramissu Coffee",
      price: 25000,
      stock: 100,
      is_bestseller: true,
    },
    {
      name: "Roti Ring Selai",
      description: "Dua Rasa, Hangatkan Keluarga Tercinta",
      price: 12000,
      stock: 50,
      is_bestseller: true,
    },
    {
      name: "Brownies Choco Hitam Putih",
      description: "Best Seller Browcin Bakery",
      price: 35000,
      stock: 200,
      is_bestseller: true,
    },
  ];

  for (const p of products) {
    await prisma.product.create({
      data: p,
    });
  }

  console.log("Products seeded!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
