// app/api/user/orders/track/route.ts
// Static segment — prevents /api/user/orders/track from
// falling into the [id] dynamic route.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { trackDelhiveryShipment } from '@/lib/delhivery';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const awb = req.nextUrl.searchParams.get('awb');
  if (!awb) {
    return NextResponse.json({ error: 'AWB number required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  // Verify this AWB belongs to an order owned by this user
  const order = await prisma.order.findFirst({
    where: { userId: user.id, awbCode: awb },
    select: { id: true, orderNumber: true, status: true, trackingUrl: true },
  });
  if (!order) {
    return NextResponse.json({ error: 'No order found for this AWB' }, { status: 404 });
  }

  try {
    const tracking = await trackDelhiveryShipment(awb);
    const pkg = tracking?.ShipmentData?.[0]?.Shipment;

    return NextResponse.json({
      tracked: true,
      awb,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingUrl: order.trackingUrl,
      courierService: 'Delhivery',
      status: pkg?.Status?.Status ?? order.status,
      expectedDelivery: pkg?.ExpectedDeliveryDate ?? null,
      events: (pkg?.Scans ?? []).map((s: {
        ScanDetail: {
          ScanDateTime: string;
          Scan: string;
          ScannedLocation: string;
          Instructions: string;
        };
      }) => ({
        time: s.ScanDetail.ScanDateTime,
        activity: s.ScanDetail.Scan,
        location: s.ScanDetail.ScannedLocation,
        instructions: s.ScanDetail.Instructions,
      })),
    });
  } catch {
    // Delhivery API failed — return order info we have locally
    return NextResponse.json({
      tracked: true,
      awb,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingUrl: order.trackingUrl,
      courierService: 'Delhivery',
      status: order.status,
      events: [],
    });
  }
}