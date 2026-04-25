// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { applyRateLimit, AUTH_LIMITER } from '@/lib/rateLimiter';
import { handleApiError, ok } from '@/lib/apiHelpers';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, AUTH_LIMITER);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { email, name, password, phone } = body;

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      // Return same message as "not found" to prevent email enumeration
      return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        password: hashedPassword,
        phone: phone?.trim() || null,
        role: 'USER',
      },
      select: { id: true, email: true, name: true },
    });

    return ok({ user }, 201);
  } catch (e) {
    return handleApiError(e, 'POST /api/auth/signup');
  }
}
