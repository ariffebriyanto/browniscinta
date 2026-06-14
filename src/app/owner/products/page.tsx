import { prisma } from "@/lib/prisma";
import ProductClient from "./ProductClient";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: [
      { display_order: "asc" },
      { createdAt: "desc" }
    ],
  });

  const serializedProducts = products.map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  return <ProductClient products={serializedProducts} />;
}
