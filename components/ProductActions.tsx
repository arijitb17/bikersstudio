"use client";

import { useState } from "react";
import { SizeSelector } from "./SizeSelector";
import AddToCartButton from "./AddToCartButton";
import ShareButton from "./ShareButton";
import type { SizeEntry } from "@/app/admin/components/SizeManager";

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    thumbnail: string;
    brandName: string;
    hasSize: boolean;
    sizes: SizeEntry[];
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const [selectedSize, setSelectedSize] = useState<SizeEntry | null>(null);

  const effectivePrice = selectedSize?.price ?? product.salePrice ?? product.price;
  const needsSizeSelection = product.hasSize && product.sizes.length > 0;

  return (
    <div className="space-y-4">
      {needsSizeSelection && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <SizeSelector
            sizes={product.sizes}
            selected={selectedSize}
            onSelect={(entry) =>
              setSelectedSize((prev) => (prev?.size === entry.size ? null : entry))
            }
          />
          {/* Live price update when size is selected */}
          {selectedSize && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-600">
                Rs. {effectivePrice.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500">for size {selectedSize.size}</span>
            </div>
          )}
        </div>
      )}

      {needsSizeSelection && !selectedSize && (
        <p className="text-sm text-amber-600 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          Please select a size to continue
        </p>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <AddToCartButton
            disabled={needsSizeSelection && !selectedSize}
            product={{
              id: product.id,
              name: product.name,
              price: effectivePrice,
              salePrice: null,
              thumbnail: product.thumbnail,
              brandName: product.brandName,
              selectedSize: selectedSize?.size,
            }}
          />
        </div>
        <ShareButton
          productName={product.name}
          productUrl={`/products/${product.slug}`}
        />
      </div>
    </div>
  );
}