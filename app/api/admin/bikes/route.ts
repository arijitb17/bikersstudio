// app/api/admin/bikes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const bikes = await prisma.bike.findMany({
      include: {
        brand: { select: { id: true, name: true } },
        _count: { select: { products: true, categories: true } }
      },
      orderBy: { position: 'asc' }
    });

    return NextResponse.json(bikes);
  } catch (error) {
    console.error('Bikes fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch bikes' }, { status: 500 });
  }
}

export async function POST(_req: NextRequest) {
  try {
    const body = await _req.json();
    const year = parseInt(body.year, 10);
if (isNaN(year)) {
  return NextResponse.json({ error: 'Valid year is required' }, { status: 400 });
}
    const bike = await prisma.bike.create({
  data: {
    name: body.name,
    slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
    model: body.model,
    year,  
    description: body.description,
    image: body.image,
    isActive: body.isActive ?? true,
    position: body.position ?? 0,
    brand: {
      connect: { id: body.brandId }  // use connect instead of brandId scalar
    }
  },
  include: {
    brand: { select: { name: true } }
  }
});

    return NextResponse.json(bike, { status: 201 });
  } catch (error) {
    console.error('Bike create error:', error);
    return NextResponse.json({ error: 'Failed to create bike' }, { status: 500 });
  }
}