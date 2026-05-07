"use client";

import { useState } from "react";
import { SizeSelector } from "./SizeSelector";
import AddToCartButton from "./AddToCartButton";
import ShareButton from "./ShareButton";
import { ColorSelector } from "./ColorSelector";
import type { SizeEntry } from "@/app/admin/components/SizeManager";
import type { ColorVariant } from "@/lib/actions";

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
    stock: number;
  };
  colorVariants?: ColorVariant[];
  activeColorId?: string;
  onColorSelect?: (variant: ColorVariant) => void;
}

export function ProductActions({
  product,
  colorVariants = [],
  activeColorId,
  onColorSelect,
}: ProductActionsProps) {
  const [selectedSize, setSelectedSize] = useState<SizeEntry | null>(null);

  const effectivePrice = selectedSize?.price ?? product.salePrice ?? product.price;
  const needsSizeSelection = product.hasSize && product.sizes.length > 0;
  const isOutOfStock = product.stock === 0;

  // Derive the active color label from the variants list
  const activeColorLabel =
    colorVariants.find((v) => v.id === activeColorId)?.color ?? undefined;

  return (
    <div className="space-y-4">
      {/* ① Color Selector */}
      {colorVariants.length > 1 && onColorSelect && activeColorId && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <ColorSelector
            variants={colorVariants}
            activeId={activeColorId}
            onSelect={(v) => {
              setSelectedSize(null);
              onColorSelect(v);
            }}
          />
        </div>
      )}

      {/* ② Size Selector */}
      {needsSizeSelection && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <SizeSelector
            sizes={product.sizes}
            selected={selectedSize}
            onSelect={(entry) =>
              setSelectedSize((prev) => (prev?.size === entry.size ? null : entry))
            }
          />
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

      {needsSizeSelection && !selectedSize && !isOutOfStock && (
        <p className="text-sm text-amber-600 font-medium flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          Please select a size to continue
        </p>
      )}

      {/* ③ Add to Cart + Share */}
      <div className="flex gap-3">
        <div className="flex-1">
          <AddToCartButton
            disabled={needsSizeSelection && !selectedSize}
            outOfStock={isOutOfStock}
            stock={product.stock}                      
            product={{
              id: product.id,
              name: product.name,
              price: effectivePrice,
              salePrice: null,
              thumbnail: product.thumbnail,
              brandName: product.brandName,
              selectedSize: selectedSize?.size,
              selectedColor: activeColorLabel,          
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