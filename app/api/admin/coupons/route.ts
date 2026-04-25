import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('Coupons fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.toUpperCase(),
        description: body.description,
        discountType: body.discountType,
        discountValue: parseFloat(body.discountValue),
        minOrderValue: body.minOrderValue ? parseFloat(body.minOrderValue) : null,
        maxDiscount: body.maxDiscount ? parseFloat(body.maxDiscount) : null,
        usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
        isActive: body.isActive ?? true,
        validFrom: new Date(body.validFrom),
        validUntil: new Date(body.validUntil)
      }
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error('Coupon create error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
