import Image from 'next/image';
import { Award, Users } from 'lucide-react';

export default function AboutUs() {
  return (
    <section className="py-20 bg-white">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-14">
          <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">
            <Award size={14} className="fill-yellow-500" />
            Who We Are
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-black tracking-tight uppercase">
            About Us
          </h2>
          <div className="mt-4 h-1.5 w-20 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full skew-x-[-20deg]" />
        </div>

        {/* First Card - Image Left */}
        <div className="mb-8">
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center
                       rounded-3xl bg-white border border-neutral-200 overflow-hidden
                       p-6 lg:p-10
                       shadow-[0_8px_24px_rgba(0,0,0,0.08)]
                       hover:shadow-[0_16px_40px_rgba(234,179,8,0.15)]
                       transition-all duration-300 ease-out"
          >
            {/* Image */}
            <div className="relative overflow-hidden rounded-2xl shadow-xl h-72 lg:h-96 group">
              <Image
                src="/about1.jpeg"
                alt="Motorcycle showroom"
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Text Content */}
            <div>
              <p className="text-yellow-600 text-[11px] uppercase tracking-[0.2em] font-bold mb-3">
                Our Story
              </p>
              <p className="text-black/80 text-base leading-relaxed text-justify">
                <strong className="text-black">Our bike store is dedicated to delivering high-quality motorcycles that combine performance, comfort, and reliability.</strong> We offer a wide range of bikes to suit every rider&apos;s needs, from daily commuters to high-performance models, all sourced from trusted brands. With a focus on innovation and design, each bike in our collection is carefully selected to ensure a smooth, safe, and enjoyable riding experience.
              </p>
            </div>
          </div>
        </div>

        {/* Speed stripe divider */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-80 mb-8" />

        {/* Second Card - Text Left */}
        <div>
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center
                       rounded-3xl bg-white border border-neutral-200 overflow-hidden
                       p-6 lg:p-10
                       shadow-[0_8px_24px_rgba(0,0,0,0.08)]
                       hover:shadow-[0_16px_40px_rgba(234,179,8,0.15)]
                       transition-all duration-300 ease-out"
          >
            {/* Text Content */}
            <div className="lg:order-1 order-2">
              <p className="text-yellow-600 text-[11px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2">
                <Users size={14} className="fill-yellow-500" />
                Our Promise
              </p>
              <p className="text-black/80 text-base leading-relaxed text-justify">
                <strong className="text-black">Beyond sales, we believe in building long-term relationships with our customers.</strong> Our knowledgeable staff provides expert guidance, transparent pricing, and dependable after-sales support to make every visit worthwhile. Whether you are a first-time buyer or an experienced rider, our bike store is committed to helping you find the perfect ride with confidence and satisfaction.
              </p>
            </div>

            {/* Image */}
            <div className="relative overflow-hidden rounded-2xl shadow-xl h-72 lg:h-96 lg:order-2 order-1 group">
              <Image
                src="/about2.jpeg"
                alt="Motorcycle display"
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}