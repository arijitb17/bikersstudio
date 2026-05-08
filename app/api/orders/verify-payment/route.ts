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
import { createDelhiveryShipment } from '@/lib/delhivery';

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
    const body = await req.json();
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    // --- Input validation ---
    if (
      typeof orderId !== 'string' ||
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // --- Verify this order belongs to the requesting user and is still PENDING ---
    const existingOrder = await prisma.order.findFirst({
      where: { id: orderId, userId: user.id },
      select: { id: true, paymentStatus: true },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Idempotency: already verified
    if (existingOrder.paymentStatus === 'COMPLETED') {
      return ok({ success: true, orderId, alreadyVerified: true });
    }

    // --- Signature verification (safe against length-mismatch crash) ---
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    let isValid = false;
    try {
      // timingSafeEqual throws if buffers differ in length — guard it
      isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(razorpay_signature, 'hex'),
      );
    } catch {
      isValid = false;
    }

    if (!isValid) {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED' },
      });
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // --- Atomic: mark paid + reduce stock + clear cart ---
    const order = await prisma.$transaction(async (tx) => {
      // Re-fetch items with current stock inside the transaction
      const orderWithItems = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!orderWithItems) throw new Error('Order disappeared during transaction');

      // Reduce stock — checked inside transaction to prevent oversell
      for (const item of orderWithItems.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'COMPLETED',
          paymentId: razorpay_payment_id,
        },
        include: { items: true },
      });

      await tx.cartItem.deleteMany({ where: { userId: user.id } });

      return updated;
    }, {
      isolationLevel: 'Serializable',
    });

    // --- Invalidate caches ---
    await Promise.all([
      invalidatePattern(`orders:user:${user.id}`),
      invalidatePattern(`orders:admin:*`),
      invalidatePattern(`dashboard:*`),
      invalidatePattern(`products:*`),
    ]);

    // --- Fetch full order details for Delhivery ---
    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, weight: true } },
          },
        },
        address: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    // --- Create Delhivery shipment (non-blocking, never fails the payment response) ---
    if (fullOrder) {
      createDelhiveryShipment({
        orderNumber: fullOrder.orderNumber,
        totalAmount: Number(fullOrder.total),
        paymentMethod: 'Prepaid',
        customer: {
          name: fullOrder.address.fullName,
          phone: fullOrder.address.phone,
          email: fullOrder.user?.email ?? undefined,
        },
        address: {
          street: fullOrder.address.street,
          city: fullOrder.address.city,
          state: fullOrder.address.state,
          pincode: fullOrder.address.pincode,
          country: fullOrder.address.country,
        },
        items: fullOrder.items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: Number(i.price),
        })),
        weight:
          fullOrder.items.reduce((sum, i) => {
            const w = i.product.weight ? Number(i.product.weight) * i.quantity : 0;
            return sum + w;
          }, 0) || 0.5,
      })
        .then(async ({ awb, trackingUrl }) => {
          // Only set shippedAt when the order physically leaves — not here.
          // Status moves to PROCESSING; SHIPPED is set by the admin/webhook later.
          await prisma.order.update({
            where: { id: order.id },
            data: {
              awbCode: awb,
              courierService: 'Delhivery',
              trackingUrl,
              status: 'PROCESSING',
              // shippedAt intentionally NOT set here — set it on actual dispatch
            },
          });
        })
        .catch((err) => {
          // Payment is confirmed — log prominently so a retry job can pick up
          // orders where awbCode is still null after N minutes.
          console.error(
            '[Delhivery] Shipment creation failed for order',
            order.id,
            order.orderNumber,
            err,
          );
          // TODO: push to a dead-letter queue / alerting system here
        });
    }

    return ok({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message.startsWith('Insufficient stock')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return handleApiError(e, 'POST /api/orders/verify-payment');
  }
}