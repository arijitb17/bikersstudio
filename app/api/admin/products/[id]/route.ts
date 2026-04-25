// app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteImages } from '@/lib/imageUtils';
import { applyRateLimit, ADMIN_WRITE_LIMITER } from '@/lib/rateLimiter';
import { invalidateKeys, invalidatePattern, CacheKey, InvalidationPattern } from '@/lib/cache';
import { handleApiError, serializeDecimals, ok } from '@/lib/apiHelpers';

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

export async function PUT(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  const limited = await applyRateLimit(_req, ADMIN_WRITE_LIMITER, auth.userId);
  if (limited) return limited;

  try {
    const { id } = await context.params;
    const body = await _req.json();

    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { images: true, thumbnail: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        price: parseFloat(body.price),
        salePrice: body.salePrice ? parseFloat(body.salePrice) : null,
        stock: parseInt(body.stock),
        sku: body.sku,
        images: body.images || [],
        thumbnail: body.thumbnail,
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

    // Async image cleanup (non-blocking)
    const newImages = body.images || [];
    const imagesToDelete = (existingProduct.images || []).filter(
      (img: string) => !newImages.includes(img) && img.startsWith('/uploads/')
    );
    if (
      existingProduct.thumbnail &&
      body.thumbnail !== existingProduct.thumbnail &&
      !newImages.includes(existingProduct.thumbnail)
    ) {
      imagesToDelete.push(existingProduct.thumbnail);
    }
    if (imagesToDelete.length > 0) {
      deleteImages(imagesToDelete).catch(console.error);
    }

    // Invalidate caches
    await Promise.all([
      invalidateKeys(CacheKey.product(id)),
      invalidatePattern(InvalidationPattern.products()),
      invalidatePattern(InvalidationPattern.dashboard()),
    ]);

    return ok(serializeDecimals(product));
  } catch (e) {
    return handleApiError(e, 'PUT /api/admin/products/[id]');
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  const limited = await applyRateLimit(_req, ADMIN_WRITE_LIMITER, auth.userId);
  if (limited) return limited;

  try {
    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      select: { images: true, thumbnail: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    const imagesToDelete = [...(product.images || [])];
    if (product.thumbnail && !imagesToDelete.includes(product.thumbnail)) {
      imagesToDelete.push(product.thumbnail);
    }
    if (imagesToDelete.length > 0) {
      deleteImages(imagesToDelete).catch(console.error);
    }

    await Promise.all([
      invalidateKeys(CacheKey.product(id)),
      invalidatePattern(InvalidationPattern.products()),
      invalidatePattern(InvalidationPattern.dashboard()),
    ]);

    return ok({ success: true, message: 'Product deleted' });
  } catch (e) {
    return handleApiError(e, 'DELETE /api/admin/products/[id]');
  }
}