// lib/parseSizes.ts  ← new file, no "use client" directive
import type { SizeEntry } from '@/app/admin/components/SizeManager';

export function parseSizes(raw: unknown): SizeEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is SizeEntry =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as SizeEntry).size === 'string' &&
      typeof (item as SizeEntry).price === 'number'
  );
}