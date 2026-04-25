// app/api/coupons/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyRateLimit, COUPON_LIMITER } from '@/lib/rateLimiter';
import { withCache, CacheKey, TTL } from '@/lib/cache';
import { handleApiError, ok } from '@/lib/apiHelpers';

export async function POST(req: NextRequest) {
  // Get session for user-specific rate limiting
  const session = await getServerSession(authOptions) as Session | null;
  const user = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
    : null;

  const limited = await applyRateLimit(req, COUPON_LIMITER, user?.id);
  if (limited) return limited;

  try {
    const { code, orderValue } = await req.json();

    if (!code?.trim()) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const upperCode = code.toUpperCase().trim();

    // Cache coupon lookup (short TTL since it can be deactivated)
    const coupon = await withCache(CacheKey.coupon(upperCode), TTL.SHORT, () =>
      prisma.coupon.findUnique({ where: { code: upperCode } })
    );

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
    }

    const now = new Date();
    const todayOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nowDate = todayOnly(now);
    const validFrom = todayOnly(new Date(coupon.validFrom));
    const validUntil = todayOnly(new Date(coupon.validUntil));

    if (nowDate < validFrom) {
      return NextResponse.json(
        { error: `Coupon will be valid from ${validFrom.toLocaleDateString('en-IN')}` },
        { status: 400 }
      );
    }

    if (nowDate > validUntil) {
      return NextResponse.json(
        { error: `Coupon expired on ${validUntil.toLocaleDateString('en-IN')}` },
        { status: 400 }
      );
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
    }

    const minOrder = coupon.minOrderValue ? Number(coupon.minOrderValue) : 0;
    if (minOrder > 0 && orderValue < minOrder) {
      return NextResponse.json(
        { error: `Minimum order value of ₹${minOrder.toFixed(2)} required` },
        { status: 400 }
      );
    }

    return ok({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        maxDiscount: coupon.maxDiscount ? Number(coupon.maxDiscount) : null,
        minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
      },
    });
  } catch (e) {
    return handleApiError(e, 'POST /api/coupons/validate');
  }
}
