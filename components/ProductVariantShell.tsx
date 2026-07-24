'use client';

import { useState } from 'react';
import { Star, Truck, Shield, RefreshCw, Package } from 'lucide-react';
import ProductImageGallery from './ProductImageGallery';
import { ProductActions } from './ProductActions';
import type { ColorVariant } from '@/lib/actions';
import type { SizeEntry } from '@/app/admin/components/SizeManager';

interface ProductVariantShellProps {
  baseProduct: {
    id: string;
    name: string;
    slug: string;
    price: number;
    salePrice: number | null;
    thumbnail: string;
    images: string[];
    stock: number;
    discount: number;
    brandName: string;
    hasSize: boolean;
    sizes: SizeEntry[];
    sku: string;
    avgRating: number;
    reviewCount: number;
    bikeName?: string;
  };
  colorVariants: ColorVariant[];
}

export function ProductVariantShell({ baseProduct, colorVariants }: ProductVariantShellProps) {
  // If this product is part of a group, default the active variant to itself
  const selfVariant = colorVariants.find((v) => v.id === baseProduct.id) ?? null;

  const [activeVariant, setActiveVariant] = useState<ColorVariant | null>(
    colorVariants.length > 1 ? selfVariant : null
  );

  // ── Derived active values ────────────────────────────────────────────────
  const activeImages =
    activeVariant && activeVariant.images.length > 0
      ? activeVariant.images
      : activeVariant
      ? [activeVariant.thumbnail]
      : baseProduct.images.length > 0
      ? baseProduct.images
      : [baseProduct.thumbnail];

  const activeThumbnail = activeVariant?.thumbnail  ?? baseProduct.thumbnail;
  const activePrice     = activeVariant?.price      ?? baseProduct.price;
  const activeSalePrice = activeVariant?.salePrice  ?? baseProduct.salePrice;
  const activeStock     = activeVariant?.stock      ?? baseProduct.stock;
  const activeName      = activeVariant?.name       ?? baseProduct.name;
  const activeDiscount  = activeSalePrice
    ? Math.round(((activePrice - activeSalePrice) / activePrice) * 100)
    : 0;

  const activeSizes: SizeEntry[] = activeVariant
    ? activeVariant?.sizes ?? []
    : baseProduct.sizes;
  const hasSize = baseProduct.hasSize && activeSizes.length > 0;
  const lowestSizePrice = hasSize ? Math.min(...activeSizes.map((s) => s.price)) : null;

  return (
    <>
      {/* ── LEFT: sticky image gallery ─────────────────────────────────── */}
      <div className="lg:sticky lg:top-24 h-fit">
        <ProductImageGallery
          images={activeImages}
          thumbnail={activeThumbnail}
          productName={activeName}
          discount={hasSize ? 0 : activeDiscount}
        />
      </div>

      {/* ── RIGHT: all product details ──────────────────────────────────── */}
      <div className="space-y-6">

        {/* Brand Badge */}
        <div className="inline-flex items-center gap-2 bg-black text-yellow-400 px-3 py-1.5 rounded-full font-bold text-sm font-mono">
          <Package className="w-4 h-4" />
          {baseProduct.brandName}
          {baseProduct.bikeName ? ` · ${baseProduct.bikeName}` : ''}
        </div>

        {/* Title + Ratings */}
        <div>
          <h1 className="text-3xl xl:text-4xl font-black uppercase tracking-tight text-black mb-3 leading-tight">
            {activeName}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(baseProduct.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'}`} />
                ))}
              </div>
              <span className="text-sm font-bold text-black">{baseProduct.avgRating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-neutral-600 font-mono">
              {baseProduct.reviewCount} {baseProduct.reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-black rounded-xl p-5 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(115deg, #facc15 0px, #facc15 2px, transparent 2px, transparent 40px)',
            }}
          />
          <div className="relative">
            {hasSize ? (
              <>
                <p className="text-sm text-neutral-400 mb-1 font-mono">Starting from</p>
                <span className="text-4xl font-black text-yellow-400 tabular-nums">Rs. {lowestSizePrice!.toLocaleString()}</span>
                <p className="text-sm text-neutral-400 mt-1">Select a size below to see exact price</p>
              </>
            ) : activeSalePrice ? (
              <>
                <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                  <span className="text-4xl font-black text-yellow-400 tabular-nums">Rs. {activeSalePrice.toLocaleString()}</span>
                  <span className="text-xl text-neutral-500 line-through tabular-nums">Rs. {activePrice.toLocaleString()}</span>
                  <span className="bg-yellow-400 text-black px-2.5 py-1 rounded-full font-bold text-sm">Save {activeDiscount}%</span>
                </div>
                <p className="text-sm text-neutral-400">Inclusive of all taxes</p>
              </>
            ) : (
              <>
                <span className="text-4xl font-black text-white tabular-nums">Rs. {activePrice.toLocaleString()}</span>
                <p className="text-sm text-neutral-400 mt-1">Inclusive of all taxes</p>
              </>
            )}
          </div>
        </div>

        {/* Stock */}
        <div className={`p-3 rounded-xl border-2 ${activeStock > 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-neutral-100 border-neutral-300'}`}>
          {activeStock > 0 ? (
            <div className="flex items-center gap-3 text-black">
              <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse" />
              <span className="font-bold text-sm">In Stock</span>
              <span className="text-sm text-neutral-600">({activeStock} units available)</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-neutral-600">
              <div className="w-2.5 h-2.5 bg-neutral-500 rounded-full" />
              <span className="font-bold text-sm">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-3">
          {([
            { icon: Truck,     title: 'Free Delivery', sub: 'Orders above Rs. 500' },
            { icon: Shield,    title: 'Warranty',      sub: '1 Year Coverage'      },
            { icon: RefreshCw, title: 'Easy Returns',  sub: '7 Days Policy'        },
            { icon: Package,   title: 'Secure Pack',   sub: 'Safe Delivery'        },
          ] as const).map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-neutral-200 hover:border-yellow-400 hover:shadow-md transition-all">
              <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <p className="font-bold text-black text-sm mb-0.5">{title}</p>
                <p className="text-xs text-neutral-600">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ProductActions: color selector (above size) + size + cart */}
        <ProductActions
          product={{
            id: activeVariant?.id ?? baseProduct.id,
            name: activeName,
            slug: activeVariant?.slug ?? baseProduct.slug,
            price: activePrice,
            salePrice: activeSalePrice,
            thumbnail: activeThumbnail,
            brandName: baseProduct.brandName,
            hasSize,
            sizes: activeSizes,
            stock: activeStock,
          }}
          colorVariants={colorVariants}
          activeColorId={activeVariant?.id ?? baseProduct.id}
          onColorSelect={setActiveVariant}
        />

        {/* SKU */}
        <div className="pt-4 border-t border-neutral-200">
          <p className="text-sm text-neutral-500 font-mono">
            SKU: <span className="font-semibold text-neutral-700">{baseProduct.sku}</span>
          </p>
        </div>
      </div>
    </>
  );
}