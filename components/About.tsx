import Image from 'next/image';
export default function AboutUs() {
  return (
    <section className="min-h-screen py-20 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex items-center relative">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        <div className="max-w-10xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 lg:p-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-red-900 mb-4">
              About Us
            </h2>
          </div>

          {/* First Card - Image Left */}
          <div className="mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Image */}
              <div className="relative overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80"
                  alt="Motorcycle showroom"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Text Content */}
              <div>
                <p className="text-gray-900 text-base leading-relaxed text-justify">
        
        
                  <strong>Our bike store is dedicated to delivering high-quality motorcycles that combine performance, comfort, and reliability.</strong> We offer a wide range of bikes to suit every rider&apos;s needs, from daily commuters to high-performance models, all sourced from trusted brands. With a focus on innovation and design, each bike in our collection is carefully selected to ensure a smooth, safe, and enjoyable riding experience.
                </p>
              </div>
            </div>
          </div>

          {/* Second Card - Text Left */}
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Text Content */}
              <div className="lg:order-1 order-2">
                <p className="text-gray-900 text-base leading-relaxed text-justify">
                  <strong>Beyond sales, we believe in building long-term relationships with our customers.</strong> Our knowledgeable staff provides expert guidance, transparent pricing, and dependable after-sales support to make every visit worthwhile. Whether you are a first-time buyer or an experienced rider, our bike store is committed to helping you find the perfect ride with confidence and satisfaction.
                </p>
              </div>

              {/* Image */}
              <div className="relative overflow-hidden rounded-2xl shadow-xl lg:order-2 order-1">
                <Image
                  src="https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=800&q=80"
                  alt="Motorcycle display"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
