"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function uploadProductImage(formData: FormData) {
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
    const imageUrl = `/uploads/${uniqueFileName}`;

    return { success: true, imageUrl };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createProduct(data: any) {
  try {
    await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        image_url: data.image_url || null,
        is_bestseller: data.is_bestseller === "true",
      },
    });
    revalidatePath("/owner/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateProduct(id: number, data: any) {
  try {
    await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        stock: parseInt(data.stock),
        image_url: data.image_url || null,
        is_bestseller: data.is_bestseller === "true",
      },
    });
    revalidatePath("/owner/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteProduct(id: number) {
  try {
    await prisma.product.delete({ where: { id } });
    revalidatePath("/owner/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateProductOrder(updates: { id: number, display_order: number }[]) {
  try {
    await prisma.$transaction(
      updates.map(u => 
        prisma.product.update({
          where: { id: u.id },
          data: { display_order: u.display_order }
        })
      )
    );
    revalidatePath("/owner/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
