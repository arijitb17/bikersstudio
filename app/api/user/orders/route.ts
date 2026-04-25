// app/api/user/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, API_LIMITER } from '@/lib/rateLimiter';
import { withCache, CacheKey, TTL } from '@/lib/cache';
import { parsePagination, buildPaginatedResponse } from '@/lib/pagination';
import { handleApiError, serializeDecimals, ok } from '@/lib/apiHelpers';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const limited = await applyRateLimit(req, API_LIMITER, user.id);
  if (limited) return limited;

  try {
    const pagination = parsePagination(req);

    const data = await withCache(
      `${CacheKey.userOrders(user.id)}:${pagination.page}:${pagination.limit}`,
      TTL.SHORT,
      async () => {
        const [orders, total] = await Promise.all([
          prisma.order.findMany({
            where: { userId: user.id },
            skip: pagination.skip,
            take: pagination.limit,
            include: {
              items: {
                include: {
                  product: { select: { name: true, slug: true, thumbnail: true } },
                },
              },
              address: {
                select: { fullName: true, phone: true, street: true, city: true, state: true, pincode: true, country: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.order.count({ where: { userId: user.id } }),
        ]);

        return buildPaginatedResponse(serializeDecimals(orders), total, pagination);
      }
    );

    return ok(data);
  } catch (e) {
    return handleApiError(e, 'GET /api/user/orders');
  }
}
