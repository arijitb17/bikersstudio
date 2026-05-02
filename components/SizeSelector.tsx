// components/SizeSelector.tsx
"use client";
import { type SizeEntry } from '@/app/admin/components/SizeManager';

interface SizeSelectorProps {
  sizes: SizeEntry[];
  selected: SizeEntry | null;
  onSelect: (entry: SizeEntry) => void;
  compact?: boolean;
}

export function SizeSelector({ sizes, selected, onSelect, compact = false }: SizeSelectorProps) {
  return (
    <div className="space-y-1.5">
      {!compact && (
        <p className="text-sm font-semibold text-gray-700">Select Size</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((entry) => {
          const isSelected = selected?.size === entry.size;
          return (
            <button
              key={entry.size}
              type="button"
              onClick={(e) => {
                e.preventDefault(); // guard against any accidental link bubble
                onSelect(entry);
              }}
              className={`
                rounded-lg border font-medium transition-colors
                ${compact ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"}
                ${isSelected
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-gray-300 text-gray-700 hover:border-red-400 bg-white"
                }
              `}
            >
              {entry.size}
              {!compact && (
                <span className="ml-1.5 opacity-75">
                  ₹{entry.price.toLocaleString('en-IN')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}