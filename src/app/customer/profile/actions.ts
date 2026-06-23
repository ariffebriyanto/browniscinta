'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";



export async function getUserProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id as string) },
    select: { name: true, phone: true, address: true, addresses: true }
  });

  return user;
}

export async function updateUserProfile(data: { name?: string; phone?: string; address?: string; password?: string }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Not authenticated" };

  try {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id: parseInt(session.user.id as string) },
      data: updateData
    });

    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('phone')) {
      return { error: "Nomor HP sudah digunakan oleh akun lain." };
    }
    return { error: error.message || "Gagal memperbarui profil" };
  }
}

export async function addAddress(data: { recipient_name: string; phone: string; full_address: string; province: string; is_jogja: boolean; is_java: boolean; is_primary: boolean }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Not authenticated" };

  try {
    const userId = parseInt(session.user.id as string);
    
    if (data.is_primary) {
      await prisma.userAddress.updateMany({
        where: { user_id: userId },
        data: { is_primary: false }
      });
    }

    const existingCount = await prisma.userAddress.count({ where: { user_id: userId } });
    const isPrimary = existingCount === 0 ? true : data.is_primary;

    await prisma.userAddress.create({
      data: {
        user_id: userId,
        recipient_name: data.recipient_name,
        phone: data.phone,
        full_address: data.full_address,
        province: data.province,
        is_jogja: data.is_jogja,
        is_java: data.is_java,
        is_primary: isPrimary
      }
    });

    revalidatePath('/customer/profile');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menambahkan alamat" };
  }
}

export async function updateAddress(id: number, data: { recipient_name?: string; phone?: string; full_address?: string; province?: string; is_jogja?: boolean; is_java?: boolean; is_primary?: boolean }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Not authenticated" };

  try {
    const userId = parseInt(session.user.id as string);

    const address = await prisma.userAddress.findFirst({ where: { id, user_id: userId } });
    if (!address) return { error: "Alamat tidak ditemukan" };

    if (data.is_primary) {
      await prisma.userAddress.updateMany({
        where: { user_id: userId },
        data: { is_primary: false }
      });
    }

    const updateData: any = {};
    if (data.recipient_name !== undefined) updateData.recipient_name = data.recipient_name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.full_address !== undefined) updateData.full_address = data.full_address;
    if (data.province !== undefined) updateData.province = data.province;
    if (data.is_jogja !== undefined) updateData.is_jogja = data.is_jogja;
    if (data.is_java !== undefined) updateData.is_java = data.is_java;
    if (data.is_primary !== undefined) updateData.is_primary = data.is_primary;

    await prisma.userAddress.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/customer/profile');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal memperbarui alamat" };
  }
}

export async function deleteAddress(id: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: "Not authenticated" };

  try {
    const userId = parseInt(session.user.id as string);

    const address = await prisma.userAddress.findFirst({ where: { id, user_id: userId } });
    if (!address) return { error: "Alamat tidak ditemukan" };

    await prisma.userAddress.delete({ where: { id } });

    if (address.is_primary) {
      const remaining = await prisma.userAddress.findFirst({ where: { user_id: userId } });
      if (remaining) {
        await prisma.userAddress.update({
          where: { id: remaining.id },
          data: { is_primary: true }
        });
      }
    }

    revalidatePath('/customer/profile');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus alamat" };
  }
}
