'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';
import AddToCartButton from './AddToCartButton';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  category: {
    name: string;
    slug: string;
  };
  bike: {
    name: string;
    brand: {
      name: string;
    };
  } | null;
}

export default function CrashGuards() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const categorySlug = 'crash-guards';
  const categoryName = 'Crash Guards';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Fetch products directly for this category
      const productsResponse = await fetch(`/api/categories/${categorySlug}/products`);

      if (!productsResponse.ok) {
        console.error('Failed to fetch products for', categorySlug, 'Status:', productsResponse.status);
        const errorText = await productsResponse.text();
        console.error('Error response:', errorText);
        setLoading(false);
        return;
      }

      const productsData = await productsResponse.json();

      const crashGuardProducts = productsData
        .slice(0, 4)
        .map((p: Product) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          salePrice: p.salePrice ? Number(p.salePrice) : null,
          thumbnail: p.thumbnail,
          category: {
            name: p.category?.name || categoryName,
            slug: p.category?.slug || categorySlug
          },
          bike: p.bike ? {
            name: p.bike.name,
            brand: {
              name: p.bike.brand?.name || ''
            }
          } : null
        }));

      setProducts(crashGuardProducts);
    } catch (error) {
      console.error('Error loading crash guards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="w-full px-6 lg:px-16 xl:px-24">
          <div className="animate-pulse">
            <div className="flex flex-col items-center mb-14">
              <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="h-12 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-1.5 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-200 rounded-3xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-14">
          <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">
            <Shield size={14} className="fill-yellow-500" />
            Ride Protected
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-black tracking-tight uppercase">
            {categoryName}
          </h2>
          <div className="mt-4 h-1.5 w-20 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full skew-x-[-20deg]" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product) => {
            const discount = product.salePrice
              ? Math.round(((product.price - product.salePrice) / product.price) * 100)
              : 0;

            const brandName = product.bike?.brand?.name || product.category.name;

            return (
              <div
                key={product.id}
                className="group relative rounded-3xl bg-white border border-neutral-200 overflow-hidden
                           transition-all duration-300 ease-out
                           hover:-translate-y-2 hover:border-yellow-400
                           shadow-[0_8px_24px_rgba(0,0,0,0.08)]
                           hover:shadow-[0_16px_40px_rgba(234,179,8,0.25)]"
              >
                {/* Discount tag */}
                {discount > 0 && (
                  <div className="absolute top-0 left-0 z-10">
                    <div
                      className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-yellow-300
                                 text-black text-xs font-black tracking-wide px-4 py-1.5
                                 rounded-br-2xl shadow-lg"
                    >
                      {discount}% OFF
                    </div>
                  </div>
                )}

                <Link href={`/products/${product.slug}`}>
                  {/* Image stage — full bleed cover */}
                  <div className="relative h-64 overflow-hidden bg-neutral-100">
                    <Image
                      src={product.thumbnail}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>

                  {/* Speed stripe divider */}
                  <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-80" />

                  {/* Info */}
                  <div className="p-6">
                    <p className="text-yellow-600 text-[11px] uppercase tracking-[0.2em] font-bold mb-2">
                      {brandName}
                    </p>
                    <h3 className="text-black font-semibold text-base mb-4 line-clamp-2 leading-snug min-h-[2.75rem]">
                      {product.name}
                    </h3>

                    <div className="flex items-baseline gap-3 mb-1">
                      {product.salePrice ? (
                        <>
                          <p className="text-black text-2xl font-black tabular-nums">
                            ₹{product.salePrice.toFixed(2)}
                          </p>
                          <p className="text-neutral-400 text-sm line-through tabular-nums">
                            ₹{product.price.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p className="text-black text-2xl font-black tabular-nums">
                          ₹{product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* CTA */}
                <div className="px-6 pb-6 pt-2">
                  <AddToCartButton
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      salePrice: product.salePrice,
                      thumbnail: product.thumbnail,
                      brandName: brandName,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-12">
          <Link
            href={`/categories/${categorySlug}`}
            className="bg-gradient-to-r from-yellow-400 to-yellow-300 text-black px-8 py-3 rounded-xl font-bold uppercase tracking-wide text-sm hover:from-yellow-300 hover:to-yellow-200 transition-all duration-300 shadow-lg hover:shadow-yellow-400/30"
          >
            View More
          </Link>
        </div>
      </div>
    </section>
  );
}