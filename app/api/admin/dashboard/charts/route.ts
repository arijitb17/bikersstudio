// app/api/admin/dashboard/charts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit, API_LIMITER } from "@/lib/rateLimiter";
import { withCache, TTL } from "@/lib/cache";
import { handleApiError, ok } from "@/lib/apiHelpers";
import { subDays, startOfDay, format, subMonths, startOfMonth, endOfMonth } from "date-fns";

async function requireAdmin(_req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId: user.id };
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  DELIVERED: "#16a34a",
  PROCESSING: "#2563eb",
  PENDING: "#d97706",
  SHIPPED: "#7c3aed",
  CANCELLED: "#dc2626",
  CONFIRMED: "#0891b2",
  REFUNDED: "#9ca3af",
};

export async function GET(_req: NextRequest) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  const limited = await applyRateLimit(
    _req,
    API_LIMITER,
    (auth as { userId: string }).userId
  );
  if (limited) return limited;

  try {
    const data = await withCache(
      "dashboard:charts",
      TTL.SHORT,
      async () => {
        const now = new Date();

        // ── 1. Revenue & orders: last 6 calendar months ──────────────────────
        const monthPromises = Array.from({ length: 6 }, (_, i) => {
          const d = subMonths(now, 5 - i);
          const from = startOfMonth(d);
          const to = endOfMonth(d);
          const label = format(d, "MMM");
          return prisma.order
            .aggregate({
              _sum: { total: true },
              _count: { id: true },
              where: {
                createdAt: { gte: from, lte: to },
                paymentStatus: "COMPLETED",
                status: { notIn: ["CANCELLED", "REFUNDED"] },
              },
            })
            .then((r) => ({
              month: label,
              revenue: Number(r._sum.total ?? 0),
              orders: r._count.id,
            }));
        });

        // ── 2. Order status breakdown (all-time) ─────────────────────────────
        const statusGroups = await prisma.order.groupBy({
          by: ["status"],
          _count: { id: true },
        });

        // ── 3. Top 5 products by units sold (all-time) ───────────────────────
        const topItems = await prisma.orderItem.groupBy({
          by: ["productId"],
          _sum: { quantity: true, subtotal: true },
          orderBy: { _sum: { quantity: "desc" } },
          take: 5,
        });

        const topProductIds = topItems.map((t) => t.productId);
        const topProductDetails = await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true },
        });
        const nameMap = Object.fromEntries(
          topProductDetails.map((p) => [p.id, p.name])
        );

        // ── 4. Weekly orders: last 7 days ────────────────────────────────────
        const weekDayPromises = Array.from({ length: 7 }, (_, i) => {
          const d = subDays(now, 6 - i);
          const from = startOfDay(d);
          const to = new Date(from.getTime() + 86_400_000 - 1);
          const label = format(d, "EEE"); // Mon, Tue, …
          return prisma.order
            .count({ where: { createdAt: { gte: from, lte: to } } })
            .then((count) => ({ day: label, orders: count }));
        });

        const [revenueData, weeklyOrders] = await Promise.all([
          Promise.all(monthPromises),
          Promise.all(weekDayPromises),
        ]);

        const orderStatusData = statusGroups.map((g) => ({
          name: g.status.charAt(0) + g.status.slice(1).toLowerCase(),
          value: g._count.id,
          color: ORDER_STATUS_COLORS[g.status] ?? "#6b7280",
        }));

        const topProducts = topItems.map((t) => ({
          name: nameMap[t.productId] ?? "Unknown Product",
          sales: t._sum.quantity ?? 0,
          revenue: Number(t._sum.subtotal ?? 0),
        }));

        return { revenueData, orderStatusData, topProducts, weeklyOrders };
      }
    );

    return ok(data);
  } catch (e) {
    return handleApiError(e, "GET /api/admin/dashboard/charts");
  }
}