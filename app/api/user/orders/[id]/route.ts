// app/api/user/orders/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap params Promise
    const { id } = await params;
    
    console.log('=== GET /api/user/orders/[id] called ===');
    console.log('Order ID from params:', id);
    
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      console.error('No session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('User email:', session.user.email);

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      console.error('User not found');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log('User ID:', user.id);

    // Fetch the specific order
    const order = await prisma.order.findFirst({
      where: {
        id: id,
        userId: user.id, // Ensure user can only access their own orders
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                thumbnail: true,
              },
            },
          },
        },
        address: {
          select: {
            fullName: true,
            phone: true,
            street: true,
            city: true,
            state: true,
            pincode: true,
            country: true,
          },
        },
      },
    });

    if (!order) {
      console.error('Order not found for ID:', id);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    console.log('Order found:', order.orderNumber);

    // Convert Decimal fields to numbers for JSON serialization
    const serializedOrder = {
      ...order,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shippingCost: Number(order.shippingCost),
      discount: Number(order.discount),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
      })),
    };

    return NextResponse.json({ order: serializedOrder });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}