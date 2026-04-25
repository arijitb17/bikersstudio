'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImageGalleryProps {
  images: string[];
  thumbnail: string;
  productName: string;
  discount?: number;
}

export default function ProductImageGallery({
  images,
  thumbnail,
  productName,
  discount = 0,
}: ProductImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Use actual images if available, otherwise use placeholder
  const allImages = images.length > 0 ? images : [thumbnail];

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="space-y-3">
      {/* Main Image - Reduced Height */}
      <div className="relative h-[400px] bg-white rounded-xl overflow-hidden shadow-md group">
        <Image
          src={allImages[selectedImage]}
          alt={`${productName} - Image ${selectedImage + 1}`}
          fill
          className="object-contain p-6"
          priority
        />
        
        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg z-10">
            {discount}% OFF
          </div>
        )}

        {/* Navigation Arrows */}
        {allImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 text-gray-900" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-semibold">
            {selectedImage + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(idx)}
              className={`relative aspect-square bg-white rounded-lg overflow-hidden transition-all ${
                selectedImage === idx
                  ? 'ring-2 ring-red-600 shadow-md'
                  : 'ring-1 ring-gray-200 hover:ring-gray-400'
              }`}
            >
              <Image
                src={img}
                alt={`${productName} thumbnail ${idx + 1}`}
                fill
                className="object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
