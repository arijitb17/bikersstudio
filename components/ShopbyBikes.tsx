export const dynamic = 'force-dynamic'
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { getBrandsForShopByBikes } from '@/lib/actions';

export default async function ShopByBikes() {
  const brands = await getBrandsForShopByBikes();

  if (!brands || brands.length === 0) {
    return null;
  }

  // Show only first 6 brands on homepage
  const displayedBrands = brands.slice(0, 6);
  const hasMore = brands.length > 6;

  return (
    <section className="pt-10 bg-white pb-10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-14">
          <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">
            <Sparkles size={14} className="fill-yellow-500" />
            Top Brands
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-black tracking-tight uppercase">
            Shop by Bikes
          </h2>
          <div className="mt-4 h-1.5 w-20 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full skew-x-[-20deg]" />
          <p className="mt-4 text-neutral-500 text-base">
            Explore premium motorcycles from top brands
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 lg:gap-6">
          {displayedBrands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group"
            >
              <div
                className="relative rounded-3xl bg-white border border-neutral-200 overflow-hidden
                           transition-all duration-300 ease-out
                           hover:-translate-y-2 hover:border-yellow-400
                           shadow-[0_8px_24px_rgba(0,0,0,0.08)]
                           hover:shadow-[0_16px_40px_rgba(234,179,8,0.25)]
                           flex flex-col items-center justify-center p-6 aspect-square"
              >
                <div className="w-full h-24 flex items-center justify-center mb-4 relative z-10">
                  {brand.logo && (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={100}
                      height={100}
                      className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110"
                    />
                  )}
                </div>

                <p className="text-xs font-semibold text-center text-black group-hover:text-yellow-600 tracking-wider transition-colors duration-300 relative z-10">
                  {brand.name.toUpperCase()}
                </p>

                {/* Yellow accent line on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </Link>
          ))}
        </div>

        {/* View More Button */}
        {hasMore && (
          <div className="mt-12 text-center">
            <Link
              href="/brands"
              className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white font-bold uppercase tracking-wide rounded-full hover:bg-yellow-400 hover:text-black transition-colors duration-300 shadow-md hover:shadow-lg"
            >
              View All Brands
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

      </div>
    </section>
  );
}