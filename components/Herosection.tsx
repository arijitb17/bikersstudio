"use client"
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image: string;
  mobileImage: string | null;
  link: string | null;
  position: number;
  isActive: boolean;
}

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Ensure client has mounted before showing dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch banners from database
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch('/api/admin/banners');
        if (response.ok) {
          const data = await response.json();
          setBanners(data);
        }
      } catch (error) {
        console.error('Failed to fetch banners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Auto-scroll every 5 seconds
  useEffect(() => {
    if (banners.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const goToSlide = (index: number): void => {
    setCurrentSlide(index);
  };

  const goToPrevious = (): void => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToNext = (): void => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  // Always show the same skeleton during SSR and initial client render
  if (!mounted || loading) {
    return (
      <div className="relative h-screen overflow-hidden mt-[80px] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show fallback if no banners
  if (banners.length === 0) {
    return (
      <div className="relative h-screen overflow-hidden mt-[80px] bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white max-w-2xl px-6">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">Welcome to Our Store</h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">Premium Motorcycles & Accessories</p>
          <Link 
            href="/products"
            className="inline-block bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105"
          >
            Explore Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden mt-[80px]">
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              currentSlide === index ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image - Desktop */}
            <picture>
              <source 
                media="(max-width: 768px)" 
                srcSet={banner.mobileImage || banner.image} 
              />
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
            </picture>
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
            
            {/* Content */}
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full">
                <div className="max-w-2xl">
                  <h1 className="text-white text-5xl md:text-7xl font-bold mb-6 drop-shadow-2xl">
                    {banner.title}
                  </h1>
                  {banner.subtitle && (
                    <p className="text-white/90 text-xl md:text-2xl mb-8 drop-shadow-lg">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.link && (
                    <Link
                      href={banner.link}
                      className="inline-block bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-2xl"
                    >
                      Shop Now
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Only show if more than 1 banner */}
      {banners.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all z-20 group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full transition-all z-20 group"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>

          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`transition-all rounded-full ${
                  currentSlide === index
                    ? 'w-10 h-2 bg-white'
                    : 'w-2 h-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
            <div
              className="h-full bg-red-600 transition-all duration-300"
              style={{ 
                width: `${((currentSlide + 1) / banners.length) * 100}%` 
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
