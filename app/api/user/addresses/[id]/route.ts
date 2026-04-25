import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const address = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });

    if (!address) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    await prisma.address.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Address deleted successfully' });
  } catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ error: 'Failed to delete address', details: message }, { status: 500 });
}
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const existingAddress = await prisma.address.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingAddress) {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 });
    }

    const { fullName, phone, street, city, state, pincode, country, isDefault } = await request.json();

    if (!fullName?.trim() || !phone?.trim() || !street?.trim() || 
        !city?.trim() || !state?.trim() || !pincode?.trim()) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
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

    return NextResponse.json({ success: true, address });
  } catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ error: 'Failed to update address', details: message }, { status: 500 });
}
}