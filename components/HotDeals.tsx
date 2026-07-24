export const dynamic = 'force-dynamic'
import Image from 'next/image';
import Link from 'next/link';
import { Flame } from 'lucide-react';
import { getFeaturedProducts } from '@/lib/actions';
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
  };
  bike: {
    name: string;
    brand: {
      name: string;
    };
  } | null;
}

export default async function HotDeals() {
  const rawProducts = await getFeaturedProducts(8);

  const products: Product[] = rawProducts
    .filter(p => p.salePrice !== null)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      thumbnail: p.thumbnail,
      category: {
        name: p.category.name
      },
      bike: p.bike ? {
        name: p.bike.name,
        brand: {
          name: p.bike.brand.name
        }
      } : null
    }))
    .slice(0, 4);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-14">
          <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">
            <Flame size={14} className="fill-yellow-500" />
            Limited Time
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-black tracking-tight uppercase">
            Hot Deals
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
                      <Flame size={12} className="fill-black" />
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
                      <p className="text-black text-2xl font-black tabular-nums">
                        ₹{product.salePrice?.toFixed(2)}
                      </p>
                      <p className="text-neutral-400 text-sm line-through tabular-nums">
                        ₹{product.price.toFixed(2)}
                      </p>
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
      </div>
    </section>
  );
}