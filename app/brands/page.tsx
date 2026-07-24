export const dynamic = 'force-dynamic'

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getBrandsForShopByBikes } from '@/lib/actions';

export default async function AllBrandsPage() {
  const brands = await getBrandsForShopByBikes();

  if (!brands || brands.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-neutral-500 font-mono text-sm uppercase tracking-widest">
          No brands available
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero band */}
      <div className="relative bg-black overflow-hidden">
        {/* faint diagonal speed lines */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, #facc15 0px, #facc15 2px, transparent 2px, transparent 40px)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-16 pt-40 pb-20 text-center">
          <div className="inline-flex items-center gap-2 text-yellow-400 text-xs font-bold tracking-[0.35em] uppercase mb-4 font-mono">
            <span className="h-1.5 w-1.5 bg-yellow-400 rounded-full" />
            Dealer Directory
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight text-white italic -skew-x-3">
            All Brands
          </h1>
          <div className="mt-5 mx-auto h-1.5 w-24 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full skew-x-[-20deg]" />
          <p className="mt-6 text-neutral-400 font-mono text-sm tracking-wide">
            {String(brands.length).padStart(2, '0')} manufacturers on the rack
          </p>
        </div>
      </div>

      {/* Plate grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-16 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {brands.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}`}
              className="group [perspective:800px]"
            >
              <div
                className="relative bg-black rounded-xl border border-neutral-800
                           p-5 h-40 flex flex-col items-center justify-between
                           shadow-[0_6px_20px_rgba(0,0,0,0.25)]
                           transition-all duration-300 ease-out
                           group-hover:border-yellow-400
                           group-hover:shadow-[0_14px_32px_rgba(234,179,8,0.25)]
                           group-hover:-translate-y-1
                           [transform-style:preserve-3d]
                           group-hover:[transform:rotateX(4deg)]"
              >
                {/* rivets */}
                <span className="absolute top-2.5 left-2.5 h-1.5 w-1.5 rounded-full bg-neutral-700 group-hover:bg-yellow-400 transition-colors" />
                <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-neutral-700 group-hover:bg-yellow-400 transition-colors" />
                <span className="absolute bottom-2.5 left-2.5 h-1.5 w-1.5 rounded-full bg-neutral-700 group-hover:bg-yellow-400 transition-colors" />
                <span className="absolute bottom-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-neutral-700 group-hover:bg-yellow-400 transition-colors" />

                {/* logo */}
                <div className="flex-1 w-full flex items-center justify-center">
                  {brand.logo && (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={90}
                      height={64}
                      className="object-contain max-h-14 w-auto brightness-0 invert opacity-70
                                 group-hover:opacity-100 transition-all duration-300"
                    />
                  )}
                </div>

                {/* plate label */}
                <div className="w-full pt-2 border-t border-neutral-800 group-hover:border-yellow-400/40 transition-colors">
                  <p className="text-center text-[11px] font-mono font-bold tracking-[0.15em] text-neutral-300 group-hover:text-yellow-400 transition-colors">
                    {brand.name.toUpperCase()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Back to Home */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-black text-white font-bold uppercase text-sm tracking-wide
                       rounded-xl hover:bg-neutral-900 border border-transparent hover:border-yellow-400
                       transition-all duration-300 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}