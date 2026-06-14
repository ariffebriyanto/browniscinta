import { prisma } from "@/lib/prisma";
import UserClient from "./UserClient";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      phone: true,
      address: true,
      role: true,
      createdAt: true,
    }
  });

  return <UserClient users={users} />;
}
