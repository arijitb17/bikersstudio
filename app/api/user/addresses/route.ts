// app/api/user/addresses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        addresses: {
          orderBy: {
            isDefault: 'desc',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      addresses: user.addresses,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch addresses', details: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  console.log('=== POST /api/user/addresses called ===');
  
  try {
    const session = await getServerSession(authOptions) as Session | null;
    console.log('Session:', session ? 'Authenticated' : 'Not authenticated');

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('Request body received');

    const {
      fullName,
      phone,
      street,
      city,
      state,
      pincode,
      country,
      isDefault,
    } = body;

    // Validation
    if (!fullName?.trim() || !phone?.trim() || !street?.trim() || 
        !city?.trim() || !state?.trim() || !pincode?.trim()) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate phone number (Indian format)
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate pincode
    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { error: 'Invalid pincode format' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create new address
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        country: country?.trim() || 'India',
        isDefault: isDefault || false,
      },
    });

    console.log('Address created successfully:', address.id);

    return NextResponse.json({
      success: true,
      address,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create address', details: message }, { status: 500 });
  }
}
