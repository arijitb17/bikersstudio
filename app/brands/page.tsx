

export const dynamic = 'force-dynamic'

import Image from 'next/image';
import Link from 'next/link';
import { getBrandsForShopByBikes } from '@/lib/actions';

export default async function AllBrandsPage() {
  const brands = await getBrandsForShopByBikes();

  if (!brands || brands.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No brands available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          
          <h1 className="text-5xl md:text-6xl font-bold text-center text-gray-900 mb-4">
            All Brands
          </h1>
          <p className="text-center text-gray-600 mb-16 text-lg">
            Explore all {brands.length} premium motorcycle brands
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex flex-col items-center justify-center p-8 aspect-square border border-gray-100 hover:border-red-200 relative overflow-hidden">
                  
                  {/* Red gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="w-full h-32 flex items-center justify-center mb-6 relative z-10">
                    {brand.logo && (
                      <Image
                        src={brand.logo}
                        alt={brand.name}
                        width={140}
                        height={140}
                        className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110"
                      />
                    )}
                  </div>

                  <p className="text-sm font-semibold text-center text-gray-700 group-hover:text-red-700 tracking-wider transition-colors duration-300 relative z-10">
                    {brand.name.toUpperCase()}
                  </p>

                  {/* Red accent line on hover */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </Link>
            ))}
          </div>

          {/* Back to Home Button */}
          <div className="mt-16 text-center">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors duration-300 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}


