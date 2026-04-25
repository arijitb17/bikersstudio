// app/api/admin/batch-upload-images/route.ts

import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'images');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const ext = path.extname(originalName);
  const nameWithoutExt = path.basename(originalName, ext);
  const sanitized = nameWithoutExt.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `${sanitized}-${timestamp}-${random}.webp`;
}

export async function POST(request: Request) {
  try {
    await ensureUploadDir();

    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push({
            file: file.name,
            error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`
          });
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          errors.push({
            file: file.name,
            error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`
          });
          continue;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const processedImage = await sharp(buffer)
          .resize(1920, 1920, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toBuffer();

        const fileName = generateFileName(file.name);
        const filePath = path.join(UPLOAD_DIR, fileName);
        await writeFile(filePath, processedImage);

        const publicUrl = `/uploads/images/${fileName}`;
        
        results.push({
          originalName: file.name,
          fileName: fileName,
          url: publicUrl,
          size: processedImage.length
        });

     } catch (error: unknown) {
  errors.push({
    file: file.name,
    error: error instanceof Error ? error.message : 'Unknown error'
  });
}
    }

    return NextResponse.json({
      success: true,
      uploaded: results.length,
      failed: errors.length,
      results,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error: unknown) {
  console.error('Batch upload error:', error);
  return NextResponse.json(
    { error: 'Batch upload failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
    { status: 500 }
  );
}
}
