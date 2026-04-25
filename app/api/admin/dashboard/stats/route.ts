// app/api/admin/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, API_LIMITER } from '@/lib/rateLimiter';
import { withCache, CacheKey, TTL } from '@/lib/cache';
import { handleApiError, ok } from '@/lib/apiHelpers';

async function requireAdmin(_req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return { userId: user.id };
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
  pendingOrders: number;
  lowStock: number;
}

export async function GET(_req: NextRequest) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  const limited = await applyRateLimit(_req, API_LIMITER, (auth as { userId: string }).userId);
  if (limited) return limited;

  try {
    const stats = await withCache<DashboardStats>(
      CacheKey.dashboardStats(),
      TTL.SHORT,
      async () => {
        const [
          totalProducts,
          totalOrders,
          totalUsers,
          pendingOrders,
          lowStockProducts,
          revenueResult,
        ] = await Promise.all([
          prisma.product.count({ where: { isActive: true } }),
          prisma.order.count(),
          prisma.user.count({ where: { role: 'USER' } }),
          prisma.order.count({ where: { status: 'PENDING' } }),
          prisma.product.count({ where: { stock: { lt: 10 }, isActive: true } }),
          prisma.order.aggregate({
            _sum: { total: true },
            where: {
              paymentStatus: 'COMPLETED',
              status: { notIn: ['CANCELLED', 'REFUNDED'] },
            },
          }),
        ]);

        return {
          totalProducts,
          totalOrders,
          totalUsers,
          revenue: Number(revenueResult._sum.total ?? 0),
          pendingOrders,
          lowStock: lowStockProducts,
        };
      },
    );

    return ok(stats);
  } catch (e) {
    return handleApiError(e, 'GET /api/admin/dashboard/stats');
  }
}