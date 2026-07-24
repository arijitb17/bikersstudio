'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  location?: string;
}

interface Props {
  testimonials: Testimonial[];
  autoplayDelay?: number;
}

export default function Testimonials({ testimonials, autoplayDelay = 4000 }: Props) {
  const [index, setIndex] = useState(0);
  const [itemsPerSlide, setItemsPerSlide] = useState(3);
  const [paused, setPaused] = useState(false);
  const interval = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = Math.ceil(testimonials.length / itemsPerSlide);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % totalSlides);
  }, [totalSlides]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    const handle = () => {
      if (window.innerWidth < 640) setItemsPerSlide(1);
      else if (window.innerWidth < 1024) setItemsPerSlide(2);
      else setItemsPerSlide(3);
    };

    handle();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  useEffect(() => {
    if (paused) return;
    interval.current = setInterval(next, autoplayDelay);

    return () => {
      if (interval.current) {
        clearInterval(interval.current);
      }
    };
  }, [next, autoplayDelay, paused]);

  const start = index * itemsPerSlide;
  const visible = testimonials.slice(start, start + itemsPerSlide);

  if (testimonials.length === 0) return null;

  return (
    <section className="relative py-24 bg-black overflow-hidden">
      {/* Ambient racing-stripe backdrop */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
        <div className="absolute -left-10 top-0 h-full w-24 bg-yellow-400 -skew-x-12" />
        <div className="absolute left-24 top-0 h-full w-8 bg-yellow-400 -skew-x-12" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6">

        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-16">
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold tracking-[0.3em] uppercase mb-3">
            <span className="h-px w-6 bg-yellow-400" />
            Rider Reviews
            <span className="h-px w-6 bg-yellow-400" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
            What Our Customers Say
          </h2>
          <div className="mt-4 h-1.5 w-20 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full skew-x-[-20deg]" />
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            key={index}
            className="grid gap-6 animate-[fadeIn_0.5s_ease-out]"
            style={{ gridTemplateColumns: `repeat(${itemsPerSlide}, 1fr)` }}
          >
            {visible.map((t) => (
              <div
                key={t.id}
                className="group relative rounded-3xl bg-neutral-900 border border-neutral-800
                           p-8 transition-all duration-300 ease-out
                           hover:-translate-y-2 hover:border-yellow-400
                           shadow-[0_8px_24px_rgba(0,0,0,0.4)]
                           hover:shadow-[0_16px_40px_rgba(234,179,8,0.15)]"
              >
                <Quote
                  size={40}
                  className="text-yellow-400/20 mb-4 fill-yellow-400/20"
                  strokeWidth={0}
                />

                <p className="text-neutral-200 leading-relaxed mb-8 min-h-[4.5rem]">
                  {t.review}
                </p>

                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-700'}
                    />
                  ))}
                </div>

                <div className="h-px w-full bg-gradient-to-r from-yellow-400/40 via-neutral-800 to-transparent mb-4" />

                <p className="font-bold text-white tracking-wide">{t.name}</p>
                {t.location && (
                  <p className="text-sm text-neutral-500 uppercase tracking-wider mt-0.5">
                    {t.location}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous testimonials"
                className="hidden md:flex items-center justify-center absolute top-1/2 -left-5 -translate-y-1/2
                           h-10 w-10 rounded-full bg-neutral-900 border border-neutral-700
                           text-white hover:bg-yellow-400 hover:text-black hover:border-yellow-400
                           transition-colors duration-200"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={next}
                aria-label="Next testimonials"
                className="hidden md:flex items-center justify-center absolute top-1/2 -right-5 -translate-y-1/2
                           h-10 w-10 rounded-full bg-neutral-900 border border-neutral-700
                           text-white hover:bg-yellow-400 hover:text-black hover:border-yellow-400
                           transition-colors duration-200"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {/* Dots */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-3 mt-10">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? 'w-10 bg-yellow-400' : 'w-2 bg-neutral-700 hover:bg-neutral-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[fadeIn_0\\.5s_ease-out\\] {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}