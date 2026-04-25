import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
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

    await prisma.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });

    const updatedAddress = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    return NextResponse.json({ success: true, address: updatedAddress });
 } catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return NextResponse.json({ error: 'Failed to set default address', details: message }, { status: 500 });
}
}