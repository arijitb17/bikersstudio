// app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, ADMIN_WRITE_LIMITER, API_LIMITER } from '@/lib/rateLimiter';
import { parsePagination, parseSort, buildPaginatedResponse } from '@/lib/pagination';
import { withCache, invalidatePattern, CacheKey, TTL, InvalidationPattern } from '@/lib/cache';
import { handleApiError, serializeDecimals, ok } from '@/lib/apiHelpers';
import type { Prisma } from '@/app/generated/prisma/client';
async function requireAdmin(_req: NextRequest): Promise<{ userId: string } | NextResponse> {
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

export async function GET(_req: NextRequest) {
  const limited = await applyRateLimit(_req, API_LIMITER);
  if (limited) return limited;

  try {
    const pagination = parsePagination(_req);
    const { searchParams } = new URL(_req.url);

    // Filter params
    const search = searchParams.get('search')?.trim() || '';
    const categoryId = searchParams.get('categoryId') || '';
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');

    const sort = parseSort(_req, ['createdAt', 'name', 'price', 'stock'], 'createdAt', 'desc');

    // Only cache simple list (no search/filters) to avoid cache explosion
    const canCache = !search && !categoryId && isActive === null && isFeatured === null;
    const cacheKey = CacheKey.products(pagination.page, pagination.limit);

    if (canCache) {
      const cached = await withCache(
        cacheKey,
        TTL.SHORT,
        () => fetchProducts(pagination, sort, { search, categoryId, isActive, isFeatured })
      );
      return ok(cached);
    }

    const data = await fetchProducts(pagination, sort, { search, categoryId, isActive, isFeatured });
    return ok(data);
  } catch (e) {
    return handleApiError(e, 'GET /api/admin/products');
  }
}

async function fetchProducts(
  pagination: ReturnType<typeof parsePagination>,
  sort: Record<string, 'asc' | 'desc'>,
  filters: { search: string; categoryId: string; isActive: string | null; isFeatured: string | null }
) {
  const where: Prisma.ProductWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.isActive !== null) where.isActive = filters.isActive === 'true';
  if (filters.isFeatured !== null) where.isFeatured = filters.isFeatured === 'true';

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: pagination.skip,
      take: pagination.limit,
      include: {
        category: { select: { id: true, name: true } },
        bike: { select: { id: true, name: true } },
      },
      orderBy: sort,
    }),
    prisma.product.count({ where }),
  ]);

  return buildPaginatedResponse(serializeDecimals(products), total, pagination);
}

export async function POST(_req: NextRequest) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  const limited = await applyRateLimit(_req, ADMIN_WRITE_LIMITER, auth.userId);
  if (limited) return limited;

  try {
    const body = await _req.json();

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        description: body.description,
        price: parseFloat(body.price),
        salePrice: body.salePrice ? parseFloat(body.salePrice) : null,
        stock: parseInt(body.stock),
        sku: body.sku,
        images: body.images || [],
        thumbnail: body.thumbnail || body.images?.[0] || '',
        categoryId: body.categoryId,
        bikeId: body.bikeId || null,
        isActive: body.isActive ?? true,
        isFeatured: body.isFeatured ?? false,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        weight: body.weight ? parseFloat(body.weight) : null,
        dimensions: body.dimensions || null,
        material: body.material || null,
        color: body.color || null,
        size: body.size || null,
      },
      include: {
        category: { select: { name: true } },
        bike: { select: { name: true } },
      },
    });

    await invalidatePattern(InvalidationPattern.products());
    await invalidatePattern(InvalidationPattern.dashboard());

    return ok(serializeDecimals(product), 201);
  } catch (e) {
    return handleApiError(e, 'POST /api/admin/products');
  }
}
