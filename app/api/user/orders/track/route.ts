// app/api/user/orders/track/route.ts
// Static segment — prevents /api/user/orders/track from
// falling into the [id] dynamic route.

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { trackDelhiveryShipment } from '@/lib/delhivery';

// Simple in-memory cache — replace with Redis if you have it available
const trackingCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): unknown | null {
  const entry = trackingCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    trackingCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: unknown): void {
  trackingCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const awb = req.nextUrl.searchParams.get('awb');
  if (!awb || typeof awb !== 'string' || awb.trim() === '') {
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
    select: { id: true, orderNumber: true, status: true, trackingUrl: true, courierService: true },
  });

  if (!order) {
    return NextResponse.json({ error: 'No order found for this AWB' }, { status: 404 });
  }

  // --- Return cached tracking data if fresh ---
  const cacheKey = `tracking:${awb}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached as object, fromCache: true });
  }

  try {
    const tracking = await trackDelhiveryShipment(awb);
    const pkg = tracking?.ShipmentData?.[0]?.Shipment;

    const result = {
      tracked: true,
      awb,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingUrl: order.trackingUrl,
      courierService: order.courierService ?? 'Delhivery',
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
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[Delhivery] Tracking fetch failed for AWB', awb, err);

    // Delhivery API failed — return what we have locally, don't cache this
    return NextResponse.json({
      tracked: false,
      awb,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trackingUrl: order.trackingUrl,
      courierService: order.courierService ?? 'Delhivery',
      status: order.status,
      events: [],
      error: 'Live tracking temporarily unavailable. Try again shortly.',
    });
  }
}