import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, phone, dob, address, password } = await req.json();

    if (!name || !phone || !password) {
      return NextResponse.json(
        { error: "Nama, Nomor HP, dan Password wajib diisi" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Nomor HP sudah terdaftar" },
        { status: 400 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        dob: dob ? new Date(dob) : null,
        address,
        password_hash,
        role: "CUSTOMER",
      },
    });

    return NextResponse.json(
      { message: "Registrasi berhasil", user: { id: user.id, name: user.name } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
