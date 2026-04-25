// app/brands/[brand]/page.tsx
export const dynamic = 'force-dynamic'
import { getBrandWithBikes } from '@/lib/actions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';

export default async function BrandBikesPage({
  params
}: {
  params: Promise<{ brand: string }>
}) {
  const { brand: brandSlug } = await params;
  const brand = await getBrandWithBikes(brandSlug);
  
  if (!brand) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-40 pb-16">
      {/* Bikes Grid Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16">
        {/* Section Header */}
        <div className="mb-12 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            {brand.name} - Available Models
          </h2>
          <p className="text-gray-600 text-lg">
            Explore our complete range of {brand.name} motorcycles
          </p>
        </div>

        {/* No Bikes Message */}
        {brand.bikes.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Bikes Available</h3>
            <p className="text-gray-600 mb-8">We&apos;re working on adding {brand.name} bikes. Check back soon!</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-4 rounded-xl transition-all transform hover:scale-105 shadow-lg"
            >
              Browse Other Brands
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}

        {/* Bikes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {brand.bikes.map((bike) => (
            <Link
              key={bike.id}
              href={`/bikes/${bike.slug}`}
              className="group animate-fade-in-up"
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 h-full flex flex-col">
                {/* Image Container */}
                <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                  {bike.image ? (
                    <Image
                      src={bike.image}
                      alt={bike.name}
                      fill
                      className="object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg className="w-20 h-20 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Bike Name */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
                    {bike.name}
                  </h3>

                  {/* Model & Year */}
                  <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
                    <span className="bg-gray-100 px-3 py-1 rounded-full font-medium">
                      {bike.model}
                    </span>
                    {bike.year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {bike.year}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {bike.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                      {bike.description}
                    </p>
                  )}

                  {/* Action Button */}
                  <button className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 rounded-xl transition-all transform group-hover:scale-105 shadow-md hover:shadow-xl flex items-center justify-center gap-2">
                    View Products
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}