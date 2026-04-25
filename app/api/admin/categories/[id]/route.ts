// app/api/admin/categories/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, ADMIN_WRITE_LIMITER } from '@/lib/rateLimiter';
import { invalidateKeys, invalidatePattern, CacheKey, InvalidationPattern } from '@/lib/cache';
import { handleApiError, ok } from '@/lib/apiHelpers';

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

async function checkCircularReference(categoryId: string, newParentId: string): Promise<boolean> {
  let currentId = newParentId;
  const visited = new Set<string>();
  while (currentId) {
    if (visited.has(currentId) || currentId === categoryId) return true;
    visited.add(currentId);
    const parent = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!parent?.parentId) break;
    currentId = parent.parentId;
  }
  return false;
}

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  const limited = await applyRateLimit(_req, ADMIN_WRITE_LIMITER, auth.userId);
  if (limited) return limited;

  try {
    const { id } = await params;
    const body = await _req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    const slugConflict = await prisma.category.findFirst({
      where: { slug: body.slug?.trim(), NOT: { id } },
    });
    if (slugConflict) {
      return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
    }

    if (body.parentId && body.parentId !== '') {
      if (body.parentId === id) {
        return NextResponse.json({ error: 'Category cannot be its own parent' }, { status: 400 });
      }
      if (await checkCircularReference(id, body.parentId)) {
        return NextResponse.json({ error: 'Circular parent reference detected' }, { status: 400 });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: body.name.trim(),
        slug: body.slug?.trim(),
        description: body.description?.trim() || null,
        image: body.image?.trim() || null,
        icon: body.icon?.trim() || null,
        showInMenu: body.showInMenu ?? true,
        menuColumns: parseInt(body.menuColumns) || 1,
        isActive: body.isActive ?? true,
        bikeId: body.bikeId || null,
        parentId: body.parentId || null,
      },
      include: {
        parent: { select: { id: true, name: true } },
        bike: { select: { id: true, name: true } },
      },
    });

    await Promise.all([
      invalidateKeys(CacheKey.category(id)),
      invalidatePattern(InvalidationPattern.categories()),
    ]);

    return ok(category);
  } catch (e) {
    return handleApiError(e, 'PUT /api/admin/categories/[id]');
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  const limited = await applyRateLimit(_req, ADMIN_WRITE_LIMITER, auth.userId);
  if (limited) return limited;

  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    if (category._count.products > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${category._count.products} products` },
        { status: 400 }
      );
    }
    if (category._count.children > 0) {
      return NextResponse.json(
        { error: `Cannot delete category with ${category._count.children} subcategories` },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    await Promise.all([
      invalidateKeys(CacheKey.category(id)),
      invalidatePattern(InvalidationPattern.categories()),
    ]);

    return ok({ success: true, message: 'Category deleted successfully' });
  } catch (e) {
    return handleApiError(e, 'DELETE /api/admin/categories/[id]');
  }
}