// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, API_LIMITER } from '@/lib/rateLimiter';
import { parsePagination, buildPaginatedResponse } from '@/lib/pagination';
import { withCache, CacheKey, TTL } from '@/lib/cache';
import { handleApiError, serializeDecimals, ok } from '@/lib/apiHelpers';
import type { Prisma } from '@/app/generated/prisma/client';
async function requireAdmin(_req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return { userId: user.id };
}

export async function GET(_req: NextRequest) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  const limited = await applyRateLimit(_req, API_LIMITER, (auth as { userId: string }).userId);
  if (limited) return limited;

  try {
    const { searchParams } = new URL(_req.url);
    const status = searchParams.get('status') || '';
    const pagination = parsePagination(_req);

    const cacheKey = CacheKey.adminOrders(pagination.page, status || 'all');

    const data = await withCache(cacheKey, TTL.SHORT, async () => {
      const where: Prisma.OrderWhereInput = status ? { status: status as Prisma.EnumOrderStatusFilter } : {};
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip: pagination.skip,
          take: pagination.limit,
          include: {
            user: { select: { id: true, name: true, email: true } },
            address: true,
            items: {
              include: {
                product: { select: { name: true, thumbnail: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
      ]);

      return buildPaginatedResponse(serializeDecimals(orders), total, pagination);
    });

    return ok(data);
  } catch (e) {
    return handleApiError(e, 'GET /api/admin/orders');
  }
}
