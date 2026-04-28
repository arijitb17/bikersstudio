import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, API_LIMITER } from '@/lib/rateLimiter';
import { handleApiError, ok } from '@/lib/apiHelpers';

export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req, API_LIMITER);
  if (limited) return limited;

  try {
    const data = await prisma.brand.findMany({
      where: {
        isActive: true,
        bikes: {
          some: {
            isActive: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      select: {
        name: true,
        slug: true,
        bikes: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    return ok(data);
  } catch (e) {
    return handleApiError(e, 'GET /api/bike-brands');
  }
}