// app/api/admin/upload-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { applyRateLimit, UPLOAD_LIMITER } from '@/lib/rateLimiter';
import { handleApiError, ok } from '@/lib/apiHelpers';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'images');
const MAX_OUTPUT_BYTES = 500 * 1024; // 500 KB

async function requireAdmin(_req: NextRequest) {
  const session = await getServerSession(authOptions) as Session | null;
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, role: true } });
  if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  return { userId: user.id };
}

export async function POST(_req: NextRequest) {
  const auth = await requireAdmin(_req);
  if (auth instanceof NextResponse) return auth;

  const limited = await applyRateLimit(_req, UPLOAD_LIMITER, (auth as { userId: string }).userId);
  if (limited) return limited;

  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await _req.formData();
    const file = formData.get('image') as File | null;

    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Adaptive quality compression to stay under MAX_OUTPUT_BYTES
    let quality = 85;
    let width = 1200;
    let output = await sharp(buffer).resize(width, width, { fit: 'inside', withoutEnlargement: true }).webp({ quality }).toBuffer();

    while (output.length > MAX_OUTPUT_BYTES && quality > 20) {
      quality -= 5;
      output = await sharp(buffer).resize(width, width, { fit: 'inside', withoutEnlargement: true }).webp({ quality }).toBuffer();
    }

    while (output.length > MAX_OUTPUT_BYTES && width > 300) {
      width -= 100;
      output = await sharp(buffer).resize(width, width, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    }

    await writeFile(filepath, output);

    return ok({
      success: true,
      url: `/uploads/images/${filename}`,
      size: output.length,
    });
  } catch (e) {
    return handleApiError(e, 'POST /api/admin/upload-image');
  }
}
