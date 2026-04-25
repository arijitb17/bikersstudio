// app/api/admin/orders/[orderId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, serializeDecimals, ok } from '@/lib/apiHelpers';
import { invalidatePattern, InvalidationPattern } from '@/lib/cache';
import type { OrderStatus } from '@/app/generated/prisma/client';

const VALID_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
];

async function requireAdmin(_req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session | null;
  if (!session?.user?.email)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
  if (!user || user.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  return { userId: user.id };
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }   
) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { orderId } = await params;   

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }
    const body = await _req.json();
    const { status } = body as { status: OrderStatus };

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        // Auto-stamp deliveredAt when marking as delivered
        ...(status === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        address: true,
        items: {
          include: {
            product: { select: { name: true, thumbnail: true } },
          },
        },
      },
    });

    // Bust all admin order cache pages
    await invalidatePattern(InvalidationPattern.orders()).catch(() => {});

    return ok(serializeDecimals(updated));
  } catch (e) {
    return handleApiError(e, 'PATCH /api/admin/orders/[orderId]');
  }
}