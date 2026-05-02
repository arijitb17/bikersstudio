// components/admin/SizeManager.tsx
"use client";

import { Plus, Trash2 } from "lucide-react";

export interface SizeEntry {
  size: string;
  price: number;
}

interface SizeManagerProps {
  hasSize: boolean;
  sizes: SizeEntry[];
  onToggle: (val: boolean) => void;
  onChange: (sizes: SizeEntry[]) => void;
}

export function SizeManager({ hasSize, sizes, onToggle, onChange }: SizeManagerProps) {
  const isOn = !!hasSize;

  function addRow() {
    onChange([...sizes, { size: "", price: 0 }]);
  }

  function updateRow(index: number, field: keyof SizeEntry, value: string | number) {
    const updated = sizes.map((entry, i) =>
      i === index ? { ...entry, [field]: field === "price" ? Number(value) : value } : entry
    );
    onChange(updated);
  }

  function removeRow(index: number) {
    onChange(sizes.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div
          className="relative"
          onClick={() => {
            const next = !isOn;
            onToggle(next);
            if (!next) onChange([]);
          }}
        >
          <div className={`w-10 h-6 rounded-full transition-colors ${isOn ? "bg-blue-600" : "bg-gray-200"}`} />
          <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${isOn ? "translate-x-4" : ""}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">Has size variants</span>
      </label>

      {/* Size rows */}
      {isOn && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_36px] gap-2 px-1">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Size</span>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Price (₹)</span>
            <span />
          </div>

          {sizes.map((entry, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
              <input
                type="text"
                placeholder="e.g. S, M, L, XL, 58"
                value={entry.size}
                onChange={(e) => updateRow(i, "size", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="0"
                min={0}
                value={entry.price || ""}
                onChange={(e) => updateRow(i, "price", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mt-1"
          >
            <Plus size={15} />
            Add size
          </button>

          {sizes.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              The base product <strong>price</strong> field acts as a fallback when no size is selected.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

