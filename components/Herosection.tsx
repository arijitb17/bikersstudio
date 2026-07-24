"use client"
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || loading) {
    return (
      <div className="relative h-screen overflow-hidden mt-[80px] bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="relative h-screen overflow-hidden mt-[80px] bg-gray-900" />
    );
  }

  return (
    <div className="relative h-screen overflow-hidden mt-[80px]">
      {/* Slides Container */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => {
          const slide = (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                currentSlide === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <picture>
                <source
                  media="(max-width: 768px)"
                  srcSet={banner.mobileImage || banner.image}
                />
                <img
                  src={banner.image}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover"
                />
              </picture>
            </div>
          );

          // If the banner has a link, make the whole slide clickable
          return banner.link ? (
            <a
              key={banner.id}
              href={banner.link}
              className={`absolute inset-0 transition-opacity duration-1000 block ${
                currentSlide === index ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <picture>
                <source
                  media="(max-width: 768px)"
                  srcSet={banner.mobileImage || banner.image}
                />
                <img
                  src={banner.image}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover"
                />
              </picture>
            </a>
          ) : (
            slide
          );
        })}
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
                width: `${((currentSlide + 1) / banners.length) * 100}%`,
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}