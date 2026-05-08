// app/api/orders/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, ORDER_LIMITER } from '@/lib/rateLimiter';
import { handleApiError, ok } from '@/lib/apiHelpers';
import Razorpay from 'razorpay';
import Decimal from 'decimal.js';
interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  selectedSize?: string | null;
  selectedColor?: string | null;
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
    const { addressId, items, couponCode } = body;

    // --- Input validation ---
    if (!addressId || typeof addressId !== 'string') {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }
    for (const item of items) {
      if (!item.productId || typeof item.productId !== 'string') {
        return NextResponse.json({ error: 'Invalid product in cart' }, { status: 400 });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
      }
    }

    // --- Verify address belongs to this user ---
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id },
    });
    if (!address) return NextResponse.json({ error: 'Invalid address' }, { status: 400 });

    // --- Server-side price + stock calculation (never trust client prices) ---
    const productIds = items.map((i: OrderItem) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, stock: true, price: true, salePrice: true },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products are unavailable' }, { status: 400 });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let serverSubtotal = new Decimal(0);
    const validatedItems: {
      productId: string;
      quantity: number;
      price: Decimal;
      subtotal: Decimal;
      selectedSize: string | null;
      selectedColor: string | null;
    }[] = [];

    for (const item of items as OrderItem[]) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      // Use the effective price from DB — never from client
      const unitPrice: Decimal = product.salePrice ?? product.price;
      const lineSubtotal = unitPrice.mul(item.quantity);
      serverSubtotal = serverSubtotal.add(lineSubtotal);
      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: unitPrice,
        subtotal: lineSubtotal,
        selectedSize: item.selectedSize ?? null,
        selectedColor: item.selectedColor ?? null,
      });
    }

    // --- Validate & apply coupon (server-side) ---
    let discount = new Decimal(0);
    if (couponCode && typeof couponCode === 'string') {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode,
          isActive: true,
          validFrom: { lte: new Date() },
          validUntil: { gte: new Date() },
        },
      });

      if (!coupon) {
        return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 400 });
      }
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
      }
      if (coupon.minOrderValue && serverSubtotal.lt(coupon.minOrderValue)) {
        return NextResponse.json({
          error: `Minimum order value for this coupon is ₹${coupon.minOrderValue}`,
        }, { status: 400 });
      }

      if (coupon.discountType === 'PERCENTAGE') {
        discount = serverSubtotal.mul(coupon.discountValue).div(100);
        if (coupon.maxDiscount && discount.gt(coupon.maxDiscount)) {
          discount = coupon.maxDiscount;
        }
      } else {
        discount = coupon.discountValue;
      }
    }

    // Fixed tax rate — move to env/config if needed
    const TAX_RATE = new Decimal(process.env.TAX_RATE ?? '0.18');
    const SHIPPING_COST = new Decimal(process.env.SHIPPING_COST ?? '0');

    const tax = serverSubtotal.sub(discount).mul(TAX_RATE).toDecimalPlaces(2);
    const total = serverSubtotal.sub(discount).add(tax).add(SHIPPING_COST).toDecimalPlaces(2);

    // --- Create Razorpay order BEFORE DB transaction so coupon isn't burned on Razorpay failure ---
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    let razorpayOrder: { id: string };
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(total.toNumber() * 100),
        currency: 'INR',
        receipt: orderNumber,
      });
    } catch (err) {
      console.error('[Razorpay] Order creation failed', err);
      return NextResponse.json({ error: 'Payment gateway error. Please try again.' }, { status: 502 });
    }

    // --- Atomic transaction: create order + stock soft-lock + coupon increment ---
    const order = await prisma.$transaction(async (tx) => {
      // Re-check stock inside transaction to prevent race conditions
      for (const item of validatedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true, name: true },
        });
        if (!product || product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${item.productId}`);
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: user.id,
          addressId,
          subtotal: serverSubtotal,
          tax,
          shippingCost: SHIPPING_COST,
          discount,
          total,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: 'CARD',
          items: {
            create: validatedItems,
          },
        },
      });

      // Increment coupon usage only after order is safely created
      if (couponCode) {
        await tx.coupon.update({
          where: { code: couponCode },
          data: { usageCount: { increment: 1 } },
        });
      }

      return created;
    }, {
      // Serializable isolation prevents phantom reads on stock
      isolationLevel: 'Serializable',
    });

    return ok({
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: total.toNumber(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '';
    if (message.startsWith('Insufficient stock')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return handleApiError(e, 'POST /api/orders/create');
  }
}