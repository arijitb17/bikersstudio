// app/brands/[brand]/page.tsx
export const dynamic = 'force-dynamic'
import { getBrandWithBikes } from '@/lib/actions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar, Bike as BikeIcon } from 'lucide-react';

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
    <div className="min-h-screen bg-white">
      {/* Hero band */}
      <div className="relative bg-black overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, #facc15 0px, #facc15 2px, transparent 2px, transparent 40px)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-16 pt-40 pb-16">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold tracking-[0.35em] uppercase mb-4 font-mono">
            <span className="h-1.5 w-1.5 bg-yellow-400 rounded-full" />
            Model Lineup
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-white italic -skew-x-3">
            {brand.name}
          </h1>
          <div className="mt-5 h-1.5 w-24 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full skew-x-[-20deg]" />
          <p className="mt-6 text-neutral-400 font-mono text-sm tracking-wide">
            {String(brand.bikes.length).padStart(2, '0')} {brand.bikes.length === 1 ? 'model' : 'models'} in the lineup
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-16">
        {/* No Bikes Message */}
        {brand.bikes.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-black rounded-full mb-6">
              <BikeIcon className="w-11 h-11 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-black uppercase text-black mb-2">No Bikes Available</h3>
            <p className="text-neutral-500 mb-8 font-mono text-sm">
              We&apos;re working on adding {brand.name} bikes. Check back soon.
            </p>
            <Link
              href="/brands"
              className="inline-flex items-center gap-2 bg-black hover:bg-neutral-900 text-white font-bold uppercase text-sm px-8 py-4 rounded-xl transition-all border border-transparent hover:border-yellow-400 shadow-lg"
            >
              Browse Other Brands
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Bikes Grid — plate-style spec cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {brand.bikes.map((bike) => (
            <Link
              key={bike.id}
              href={`/bikes/${bike.slug}`}
              className="group"
            >
              <div
                className="relative rounded-2xl bg-white border border-neutral-200 overflow-hidden h-full flex flex-col
                           transition-all duration-300 ease-out
                           hover:-translate-y-2 hover:border-yellow-400
                           shadow-[0_8px_24px_rgba(0,0,0,0.08)]
                           hover:shadow-[0_16px_40px_rgba(234,179,8,0.25)]"
              >
                {/* Image stage */}
                <div className="relative h-60 bg-neutral-100 overflow-hidden">
                  {bike.image ? (
                    <Image
                      src={bike.image}
                      alt={bike.name}
                      fill
                      className="object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BikeIcon className="w-16 h-16 text-neutral-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Speed stripe divider */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-80" />

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-black uppercase tracking-tight text-black mb-3 group-hover:text-yellow-600 transition-colors">
                    {bike.name}
                  </h3>

                  {/* Spec readout row */}
                  <div className="flex items-center gap-2 mb-3 font-mono text-xs">
                    <span className="bg-black text-yellow-400 px-3 py-1 rounded-full font-bold tracking-wide">
                      {bike.model}
                    </span>
                    {bike.year && (
                      <span className="flex items-center gap-1 text-neutral-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {bike.year}
                      </span>
                    )}
                  </div>

                  {bike.description && (
                    <p className="text-neutral-500 text-sm mb-4 line-clamp-2 flex-1">
                      {bike.description}
                    </p>
                  )}

                  <button className="w-full bg-black hover:bg-neutral-900 text-white font-bold uppercase text-sm py-3 rounded-xl transition-all border border-transparent group-hover:border-yellow-400 flex items-center justify-center gap-2">
                    View Products
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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