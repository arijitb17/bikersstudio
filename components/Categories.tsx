"use client"
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CategoryItem {
  id: string;
  name: string;
  image: string;
  slug: string;
}

interface ShopByCategoriesProps {
  limit?: number;
  offset?: number;
  showTitle?: boolean;
}

export default function ShopByCategories({ 
  limit, 
  offset = 0, 
  showTitle = true 
}: ShopByCategoriesProps = {}) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      console.log('Fetching categories...');
      const response = await fetch('/api/menu-items/categories-display');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Categories loaded:', data);
      console.log('Number of categories:', data.length);
      
      setCategories(data);
      setError(null);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError(error instanceof Error ? error.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  // Apply offset and limit to categories
  const startIndex = offset;
  const endIndex = limit ? offset + limit : categories.length;
  const displayCategories = categories.slice(startIndex, endIndex);

  if (loading) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse">
            {showTitle && (
              <div className="h-10 bg-gray-300 rounded w-48 mx-auto mb-12"></div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(limit || 4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Categories</h2>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={loadCategories}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (displayCategories.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-6">
        {showTitle && (
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-800 mb-12">
            Shop by Categories
          </h2>
        )}

        {/* Simple responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayCategories.map((cat) => (
            <Link 
              href={`/categories/${cat.slug}`} 
              className="group" 
              key={cat.id}
            >
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
                <Image 
                  src={cat.image} 
                  alt={cat.name} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white font-bold text-2xl mb-1 drop-shadow-lg">
                    {cat.name}
                  </h3>
                  <p className="text-white/90 text-sm">Shop Now →</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
