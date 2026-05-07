'use client';

import { useRouter } from 'next/navigation';
import type { ColorVariant } from '@/lib/actions';
import tinycolor from 'tinycolor2';
interface ColorSelectorProps {
  variants: ColorVariant[];
  activeId: string;
  onSelect: (variant: ColorVariant) => void;
}

function resolveColor(variant: ColorVariant): { label: string; hex: string } {
  const label = variant.color?.trim() || '—';
  if (!label || label === '—') return { label: '—', hex: '#9ca3af' };

  // tinycolor can parse: "red", "dark red", "ms black", "r-flat silver", 
  // hex, rgb, hsl, named colors, etc.
  const parsed = tinycolor(label);

  if (parsed.isValid()) {
    return { label, hex: parsed.toHexString() };
  }

  // For compound names like "MS Black", "R-Flat Silver" — extract the core color word
  const words = label.toLowerCase().split(/[\s\-_]+/);
  for (const word of words.reverse()) { // check last word first ("black" in "ms black")
    const attempt = tinycolor(word);
    if (attempt.isValid()) {
      return { label, hex: attempt.toHexString() };
    }
  }

  // Deterministic hash fallback for truly unknown colors
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
    hash |= 0;
  }
  return { label, hex: `hsl(${Math.abs(hash) % 360}, 45%, 40%)` };
}

export function ColorSelector({ variants, activeId, onSelect }: ColorSelectorProps) {
  const router = useRouter();

  if (variants.length <= 1) return null;

  const activeVariant = variants.find((v) => v.id === activeId);
  const activeColor = activeVariant ? resolveColor(activeVariant) : null;

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2.5">
        Color:{' '}
        <span className="font-normal text-gray-500">
          {activeColor?.label ?? '—'}
        </span>
      </p>
      <div className="flex flex-wrap gap-2.5">
        {variants.map((variant) => {
          const isActive = variant.id === activeId;
          const { label, hex } = resolveColor(variant);
          const isOutOfStock = variant.stock === 0;

          return (
            <button
              key={variant.id}
              onClick={() => {
                onSelect(variant);
                router.replace(`/products/${variant.slug}`, { scroll: false });
              }}
              title={`${label}${isOutOfStock ? ' (Out of Stock)' : ''}`}
              className={`relative w-9 h-9 rounded-full transition-all duration-200 flex-shrink-0
                ${isActive
                  ? 'ring-2 ring-red-600 ring-offset-2 scale-110'
                  : 'ring-1 ring-gray-300 hover:ring-gray-400 hover:scale-105'
                }
                ${isOutOfStock ? 'opacity-40' : ''}
              `}
            >
              <span
                className="absolute inset-0 rounded-full border border-black/10"
                style={{ backgroundColor: hex }}
              />
              {isOutOfStock && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="block w-px h-8 bg-gray-400/70 rotate-45 rounded-full"
                    style={{ transformOrigin: 'center' }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}