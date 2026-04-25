// app/api/admin/banners/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, ADMIN_WRITE_LIMITER, API_LIMITER } from '@/lib/rateLimiter';
import { withCache, invalidatePattern, CacheKey, TTL, InvalidationPattern } from '@/lib/cache';
import { handleApiError, ok } from '@/lib/apiHelpers';

async function requireAdmin(_req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return { userId: user.id };
}

// Public GET (used on homepage — high traffic)
export async function GET(_req: NextRequest) {
  const limited = await applyRateLimit(_req, API_LIMITER);
  if (limited) return limited;
  try {
    const data = await withCache(CacheKey.banners(), TTL.MEDIUM, () =>
      prisma.banner.findMany({
        where: { isActive: true },
        orderBy: { position: 'asc' },
      })
    );
    return ok(data);
  } catch (e) {
    return handleApiError(e, 'GET /api/admin/banners');
  }
}

export async function POST(_req: NextRequest) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;
  const limited = await applyRateLimit(_req, ADMIN_WRITE_LIMITER, (auth as { userId: string }).userId);
  if (limited) return limited;
  try {
    const body = await _req.json();
    const banner = await prisma.banner.create({
      data: {
        title: body.title,
        subtitle: body.subtitle || null,
        image: body.image,
        mobileImage: body.mobileImage || null,
        link: body.link || null,
        position: body.position ?? 0,
        isActive: body.isActive ?? true,
      },
    });
    await invalidatePattern(InvalidationPattern.banners());
    return ok(banner, 201);
  } catch (e) {
    return handleApiError(e, 'POST /api/admin/banners');
  }
}
