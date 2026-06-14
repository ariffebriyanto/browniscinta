"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateUser(id: number, data: any) {
  try {
    const updateData: any = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      role: data.role,
    };

    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });
    revalidatePath("/owner/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteUser(id: number) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/owner/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
