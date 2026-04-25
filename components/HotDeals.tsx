export const dynamic = 'force-dynamic'
import Image from 'next/image';
import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/actions';
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
  };
  bike: {
    name: string;
    brand: {
      name: string;
    };
  } | null;
}

export default async function HotDeals() {
  const rawProducts = await getFeaturedProducts(8);
  
  const products: Product[] = rawProducts
    .filter(p => p.salePrice !== null)
    .map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      salePrice: p.salePrice ? Number(p.salePrice) : null,
      thumbnail: p.thumbnail,
      category: {
        name: p.category.name
      },
      bike: p.bike ? {
        name: p.bike.name,
        brand: {
          name: p.bike.brand.name
        }
      } : null
    }))
    .slice(0, 4);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-12 drop-shadow-md text-center">
          Hot Deals
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
                      <p className="text-red-600 text-2xl font-bold">
                        Rs. {product.salePrice?.toFixed(2)}
                      </p>
                      <p className="text-gray-400 text-base line-through">
                        Rs. {product.price.toFixed(2)}
                      </p>
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
      </div>
    </section>
  );
}
