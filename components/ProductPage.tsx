"use client";
import Image from 'next/image';
import { useState } from "react";
import Link from 'next/link';
import { SizeSelector } from "./SizeSelector";
import type { SizeEntry } from '@/app/admin/components/SizeManager';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    salePrice?: number | null;
    thumbnail: string;
    stock: number;
    hasSize: boolean;
    sizes: SizeEntry[];
    category: { name: string };
    bike?: {
      name: string;
      brand: { name: string };
    } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<SizeEntry | null>(null);

  const basePrice = product.salePrice ?? product.price;
  const effectivePrice = selectedSize?.price ?? basePrice;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full flex flex-col group">
      
      {/* Clickable: image + name */}
      <Link href={`/products/${product.slug}`} className="block flex-shrink-0">
        {/* Image */}
        <div className="relative h-64 bg-gray-50 overflow-hidden">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {hasDiscount && (
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {discountPercent}% OFF
              </span>
            )}
            {product.stock > 0 && product.stock < 10 && (
              <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Only {product.stock} left
              </span>
            )}
            {product.stock === 0 && (
              <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Name + category */}
        <div className="px-4 pt-4">
          <div className="flex items-center gap-2 mb-1.5 text-xs text-gray-500">
            <span className="font-medium">{product.category.name}</span>
            {product.bike && (
              <>
                <span>•</span>
                <span className="truncate">
                  {product.bike.brand.name} {product.bike.name}
                </span>
              </>
            )}
          </div>
          <h3 className="text-base font-bold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
        </div>
      </Link>

      {/* Non-clickable: size selector + price */}
      <div className="px-4 pb-4 pt-3 flex flex-col gap-3 mt-auto">
        {product.hasSize && product.sizes.length > 0 && (
          // stopPropagation not needed since we're outside the Link now
          <SizeSelector
            sizes={product.sizes}
            selected={selectedSize}
            onSelect={(entry) => setSelectedSize(prev => prev?.size === entry.size ? null : entry)}
            compact
          />
        )}

        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-red-600">
            ₹{effectivePrice.toLocaleString('en-IN')}
          </span>
          {/* Show original only when no size selected and there's a sale */}
          {!selectedSize && hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          )}
          {/* Show size label when selected */}
          {selectedSize && (
            <span className="text-xs text-gray-500 font-medium">
              Size: {selectedSize.size}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}