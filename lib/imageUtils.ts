// lib/imageUtils.ts

import { unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'images');

/**
 * Delete an image file from the uploads folder
 * @param imageUrl - The public URL of the image (e.g., /uploads/images/filename.webp)
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Skip if imageUrl is empty or null
    if (!imageUrl) return;

    // Extract filename from URL
    const filename = imageUrl.split('/').pop();
    if (!filename) return;

    const filepath = path.join(UPLOAD_DIR, filename);

    // Check if file exists before attempting to delete
    if (existsSync(filepath)) {
      await unlink(filepath);
      console.log(`Deleted image: ${filename}`);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - allow the main operation to continue even if file deletion fails
  }
}

/**
 * Delete multiple images
 * @param imageUrls - Array of public image URLs
 */
export async function deleteImages(imageUrls: string[]): Promise<void> {
  if (!imageUrls || imageUrls.length === 0) return;
  
  await Promise.all(
    imageUrls.filter(url => url && url.trim()).map(url => deleteImage(url))
  );
}

/**
 * Get file size of an uploaded image
 * @param imageUrl - The public URL of the image
 */
export async function getImageSize(imageUrl: string): Promise<number | null> {
  try {
    if (!imageUrl) return null;

    const filename = imageUrl.split('/').pop();
    if (!filename) return null;

    const filepath = path.join(UPLOAD_DIR, filename);
    
    if (!existsSync(filepath)) return null;

    const { stat } = await import('fs/promises');
    const stats = await stat(filepath);
    return stats.size;
  } catch (error) {
    console.error('Error getting image size:', error);
    return null;
  }
}
