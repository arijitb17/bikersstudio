// app/api/admin/categories/route.ts
// KEY FIX: withCache falls back to direct DB query if Redis is unavailable
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, ADMIN_WRITE_LIMITER, API_LIMITER } from '@/lib/rateLimiter';
import { handleApiError, ok } from '@/lib/apiHelpers';

// ─── Safe cache wrapper — never throws, falls back to direct fetch ────────────
async function safeCache<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  try {
    // Try to import and use cache — if Redis is down this will throw
    const { withCache } = await import('@/lib/cache');
    return withCache(key, ttl, fetcher);
  } catch {
    // Redis unavailable — query DB directly
    return fetcher();
  }
}

async function requireAdmin(_req: NextRequest): Promise<{ userId: string } | NextResponse> {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return { userId: user.id };
}

export async function GET(_req: NextRequest) {
  const limited = await applyRateLimit(_req, API_LIMITER);
  if (limited) return limited;

  try {
    const data = await safeCache('categories:all', 300, async () => {
      return prisma.category.findMany({
        include: {
          parent: { select: { id: true, name: true } },
          bike:   { select: { id: true, name: true } },
          _count: { select: { products: true, children: true } },
        },
        orderBy: { name: 'asc' },
      });
    });

    return ok(data);
  } catch (e) {
    return handleApiError(e, 'GET /api/admin/categories');
  }
}

export async function POST(_req: NextRequest) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  const limited = await applyRateLimit(_req, ADMIN_WRITE_LIMITER, (auth as { userId: string }).userId);
  if (limited) return limited;

  try {
    const body = await _req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const slug =
      body.slug?.trim() ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    const category = await prisma.category.create({
      data: {
        name:        body.name.trim(),
        slug,
        description: body.description?.trim() || null,
        image:       body.image?.trim()        || null,
        icon:        body.icon?.trim()         || null,
        showInMenu:  body.showInMenu  ?? true,
        menuColumns: parseInt(body.menuColumns) || 1,
        isActive:    body.isActive    ?? true,
        bikeId:      body.bikeId   || null,
        parentId:    body.parentId || null,
      },
      include: {
        parent: { select: { id: true, name: true } },
        bike:   { select: { id: true, name: true } },
      },
    });

    // Best-effort cache invalidation — ignore if Redis is down
    try {
      const { invalidatePattern, InvalidationPattern } = await import('@/lib/cache');
      await invalidatePattern(InvalidationPattern.categories());
    } catch { /* Redis unavailable, skip */ }

    return ok(category, 201);
  } catch (e) {
    return handleApiError(e, 'POST /api/admin/categories');
  }
}
