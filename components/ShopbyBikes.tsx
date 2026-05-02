export const dynamic = 'force-dynamic'
import Image from 'next/image';
import Link from 'next/link';
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
        
        <h2 className="text-5xl md:text-6xl font-bold text-center text-gray-900 mb-4">
          Shop by Bikes
        </h2>
        <p className="text-center text-gray-600 mb-16 text-lg">
          Explore premium motorcycles from top brands
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayedBrands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group"
            >
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex flex-col items-center justify-center p-6 aspect-square border border-gray-100 hover:border-red-200 relative overflow-hidden">
                
                {/* Red gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
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

                <p className="text-xs font-semibold text-center text-gray-700 group-hover:text-red-700 tracking-wider transition-colors duration-300 relative z-10">
                  {brand.name.toUpperCase()}
                </p>

                {/* Red accent line on hover */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </Link>
          ))}
        </div>

        {/* View More Button */}
        {hasMore && (
          <div className="mt-12 text-center">
            <Link 
              href="/brands"
              className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors duration-300 shadow-md hover:shadow-lg"
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
