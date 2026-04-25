// app/api/admin/brands/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteImage } from '@/lib/imageUtils';
import { applyRateLimit, ADMIN_WRITE_LIMITER } from '@/lib/rateLimiter';
import { invalidateKeys, invalidatePattern, CacheKey, InvalidationPattern } from '@/lib/cache';
import { handleApiError, ok } from '@/lib/apiHelpers';

async function requireAdmin(_req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return { userId: user.id };
}

export async function PUT(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;
  const limited = await applyRateLimit(_req, ADMIN_WRITE_LIMITER, (auth as { userId: string }).userId);
  if (limited) return limited;

  try {
    const { id } = await context.params;
    const body = await _req.json();

    const existing = await prisma.brand.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    const brand = await prisma.brand.update({
      where: { id },
      data: {
        name: body.name,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        logo: body.logo || existing.logo,
        bgColor: body.bgColor || 'bg-white',
        textColor: body.textColor || 'text-gray-800',
        description: body.description || null,
        isActive: body.isActive ?? true,
        position: body.position ?? 0,
      },
    });

    if (existing.logo && body.logo && existing.logo !== body.logo && existing.logo.startsWith('/uploads/')) {
      deleteImage(existing.logo).catch(console.error);
    }

    await Promise.all([
      invalidateKeys(CacheKey.brand(id)),
      invalidatePattern(InvalidationPattern.brands()),
    ]);

    return ok(brand);
  } catch (e) {
    return handleApiError(e, 'PUT /api/admin/brands/[id]');
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;
  const limited = await applyRateLimit(_req, ADMIN_WRITE_LIMITER, (auth as { userId: string }).userId);
  if (limited) return limited;

  try {
    const { id } = await context.params;

    const brand = await prisma.brand.findUnique({ where: { id }, select: { logo: true } });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    await prisma.brand.delete({ where: { id } });

    if (brand.logo?.startsWith('/uploads/')) {
      deleteImage(brand.logo).catch(console.error);
    }

    await Promise.all([
      invalidateKeys(CacheKey.brand(id)),
      invalidatePattern(InvalidationPattern.brands()),
    ]);

    return ok({ success: true, message: 'Brand deleted' });
  } catch (e) {
    return handleApiError(e, 'DELETE /api/admin/brands/[id]');
  }
}