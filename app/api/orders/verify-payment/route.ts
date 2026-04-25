// app/api/orders/verify-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, ORDER_LIMITER } from '@/lib/rateLimiter';
import { invalidatePattern } from '@/lib/cache';
import { handleApiError, ok } from '@/lib/apiHelpers';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const limited = await applyRateLimit(req, ORDER_LIMITER, user.id);
  if (limited) return limited;

  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Constant-time comparison to prevent timing attacks
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!isValid) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED' },
      });
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Atomic: update order + reduce stock + clear cart in one transaction
    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED', paymentStatus: 'COMPLETED', paymentId: razorpay_payment_id },
        include: { items: true },
      });

      // Decrement stock for each item
      for (const item of updated.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { userId: user.id } });

      return updated;
    });

    // Invalidate caches
    await Promise.all([
      invalidatePattern(`orders:user:${user.id}`),
      invalidatePattern(`orders:admin:*`),
      invalidatePattern(`dashboard:*`),
      invalidatePattern(`products:*`), // stock changed
    ]);

    return ok({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (e) {
    return handleApiError(e, 'POST /api/orders/verify-payment');
  }
}
