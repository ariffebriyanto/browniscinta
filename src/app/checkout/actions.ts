"use server";

import { prisma } from "@/lib/prisma";

export async function getProductForCart(id: number) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        image_url: true,
      }
    });
    return product;
  } catch (error) {
    console.error("Failed to fetch product for cart:", error);
    return null;
  }
}
