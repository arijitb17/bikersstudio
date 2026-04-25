'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import AddToCartButton from './AddToCartButton';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  category: {
    name: string;
    slug: string;
  };
  bike: {
    name: string;
    brand: {
      name: string;
    };
  } | null;
}

export default function FogLights() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Update this slug to match your fog lights category slug
  const categorySlug = 'accessories'; // Change to your actual fog lights category slug
  const categoryName = 'Fog Lights'; // Display name

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Fetch products directly for this category
      const productsResponse = await fetch(`/api/categories/${categorySlug}/products`);
      
      if (!productsResponse.ok) {
        console.error('Failed to fetch products for', categorySlug, 'Status:', productsResponse.status);
        const errorText = await productsResponse.text();
        console.error('Error response:', errorText);
        setLoading(false);
        return;
      }
      
      const productsData = await productsResponse.json();
      
      const fogLightProducts = productsData
        .slice(0, 4)
        .map((p: Product) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: Number(p.price),
          salePrice: p.salePrice ? Number(p.salePrice) : null,
          thumbnail: p.thumbnail,
          category: {
            name: p.category?.name || categoryName,
            slug: p.category?.slug || categorySlug
          },
          bike: p.bike ? {
            name: p.bike.name,
            brand: {
              name: p.bike.brand?.name || ''
            }
          } : null
        }));
      
      setProducts(fogLightProducts);
    } catch (error) {
      console.error('Error loading fog lights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16">
        <div className="w-full px-6 lg:px-16 xl:px-24">
          <div className="animate-pulse">
            <div className="flex justify-between items-center mb-12">
              <div className="h-12 bg-gray-300 rounded w-64"></div>
              <div className="h-12 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-96 bg-gray-300 rounded-2xl"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        <h2 className="text-4xl md:text-5xl font-bold text-black drop-shadow-md text-center mb-12">
          {categoryName}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => {
            const discount = product.salePrice 
              ? Math.round(((product.price - product.salePrice) / product.price) * 100)
              : 0;
            
            const brandName = product.bike?.brand?.name || product.category.name;

            return (
              <div
                key={product.id}
                className="bg-gray-50 rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:-translate-y-3 shadow-xl hover:shadow-2xl"
              >
                <Link href={`/products/${product.slug}`}>
                  <div className="relative">
                    {discount > 0 && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm z-10 shadow-lg">
                        -{discount}%
                      </div>
                    )}

                    <div className="bg-white p-8 flex items-center justify-center h-72">
                      <Image
                        src={product.thumbnail}
                        alt={product.name}
                        width={220}
                        height={220}
                        className="object-contain w-full h-full drop-shadow-lg"
                      />
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50">
                    <div className="flex items-baseline gap-3 mb-3">
                      {product.salePrice ? (
                        <>
                          <p className="text-red-600 text-2xl font-bold">
                            Rs. {product.salePrice.toFixed(2)}
                          </p>
                          <p className="text-gray-400 text-base line-through">
                            Rs. {product.price.toFixed(2)}
                          </p>
                        </>
                      ) : (
                        <p className="text-black text-2xl font-bold">
                          Rs. {product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <h3 className="text-black font-semibold text-base mb-2 line-clamp-2 leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-gray-500 text-xs uppercase tracking-widest font-medium">
                      {brandName}
                    </p>
                  </div>
                </Link>

                <div className="px-6 pb-6 bg-gray-50">
                  <AddToCartButton 
                    product={{
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      salePrice: product.salePrice,
                      thumbnail: product.thumbnail,
                      brandName: brandName,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center mt-12">
          <Link 
            href={`/categories/${categorySlug}`}
            className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors duration-300 shadow-lg"
          >
            View More
          </Link>
        </div>
      </div>
    </section>
  );
}
