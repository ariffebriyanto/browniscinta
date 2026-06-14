import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OwnerLayoutClient from "./OwnerLayoutClient";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user?.role !== "OWNER") {
    redirect("/login");
  }

  const actionNeededCount = await prisma.order.count({
    where: {
      status: {
        in: ["PAID", "REFUND_PENDING"]
      }
    }
  });

  return (
    <OwnerLayoutClient userName={session.user?.name} actionNeededCount={actionNeededCount}>
      {children}
    </OwnerLayoutClient>
  );
}
