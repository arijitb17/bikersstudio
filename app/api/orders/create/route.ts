// app/api/orders/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, ORDER_LIMITER } from '@/lib/rateLimiter';
import { invalidatePattern } from '@/lib/cache';
import { handleApiError, ok } from '@/lib/apiHelpers';
import Razorpay from 'razorpay';
interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  selectedSize?: string | null;  // ← add this
}
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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
    const { addressId, items, subtotal, tax, shippingCost, discount, total, couponCode } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // Verify address
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id },
    });
    if (!address) return NextResponse.json({ error: 'Invalid address' }, { status: 400 });

    // Verify stock — batched lookup
    const productIds = items.map((i: OrderItem) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });
      }
      if (product.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
      }
    }

    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: 'INR',
      receipt: orderNumber,
    });

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          addressId,
          subtotal,
          tax,
          shippingCost,
          discount,
          total,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: 'CARD',
          items: {
  create: items.map((item: OrderItem) => ({
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    subtotal: item.price * item.quantity,
    selectedSize: item.selectedSize ?? null,  // ← add this
  })),
},
        },
      });

      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      return created;
    });

    // Invalidate user orders cache
    await invalidatePattern(`orders:user:${user.id}`);

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: total,
    });
  } catch (e) {
    return handleApiError(e, 'POST /api/orders/create');
  }
}
