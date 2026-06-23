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
        expiration_days: true,
      }
    });
    return product;
  } catch (error) {
    console.error("Failed to fetch product for cart:", error);
    return null;
  }
}

export async function getProductsForCart(ids: number[]) {
  try {
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        price: true,
        image_url: true,
        expiration_days: true,
      }
    });
    return products;
  } catch (error) {
    console.error("Failed to fetch products for cart:", error);
    return [];
  }
}
