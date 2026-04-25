// app/api/admin/brands/route.ts
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

export async function GET(_req: NextRequest) {
  const limited = await applyRateLimit(_req, API_LIMITER);
  if (limited) return limited;
  try {
    const data = await withCache(CacheKey.brands(), TTL.MEDIUM, () =>
      prisma.brand.findMany({
        include: { _count: { select: { bikes: true } } },
        orderBy: { position: 'asc' },
      })
    );
    return ok(data);
  } catch (e) {
    return handleApiError(e, 'GET /api/admin/brands');
  }
}

export async function POST(_req: NextRequest) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;
  const limited = await applyRateLimit(_req, ADMIN_WRITE_LIMITER, (auth as { userId: string }).userId);
  if (limited) return limited;
  try {
    const body = await _req.json();
    const existing = await prisma.brand.findFirst({
  where: {
    OR: [
      { name: body.name },
      { slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-') }
    ]
  }
});

if (existing) {
  return NextResponse.json(
    { error: "Brand with same name or slug already exists" },
    { status: 400 }
  );
}
    const brand = await prisma.brand.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        logo: body.logo,
        bgColor: body.bgColor || 'bg-white',
        textColor: body.textColor || 'text-gray-800',
        description: body.description || null,
        isActive: body.isActive ?? true,
        position: body.position || 0,
      },
    });
    await invalidatePattern(InvalidationPattern.brands());
    return ok(brand, 201);
  } catch (e) {
    return handleApiError(e, 'POST /api/admin/brands');
  }
}
