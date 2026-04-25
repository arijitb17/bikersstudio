import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  if (!q) return NextResponse.json([]);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      thumbnail: true,
    },
    take: 10,
  });

  return NextResponse.json(products);
}