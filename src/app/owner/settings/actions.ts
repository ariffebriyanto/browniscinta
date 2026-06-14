"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSettings(data: any) {
  try {
    for (const [key, value] of Object.entries(data)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
    }
    revalidatePath("/owner/settings");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
