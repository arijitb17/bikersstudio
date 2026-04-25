import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    salePrice?: number | null;
    thumbnail: string;
    stock: number;
    category: { name: string };
    bike?: {
      name: string;
      brand: { name: string };
    } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const finalPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 h-full flex flex-col">
        {/* Product Image */}
        <div className="relative h-64 bg-gray-50 overflow-hidden">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {hasDiscount && (
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                {Math.round(((product.price - finalPrice) / product.price) * 100)}% OFF
              </span>
            )}
            {product.stock < 10 && product.stock > 0 && (
              <span className="bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Only {product.stock} left
              </span>
            )}
            {product.stock === 0 && (
              <span className="bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Out of Stock
              </span>
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Category & Bike Info */}
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
            <span className="font-medium">{product.category.name}</span>
            {product.bike && (
              <>
                <span>•</span>
                <span className="truncate">
                  {product.bike.brand.name} {product.bike.name}
                </span>
              </>
            )}
          </div>

          {/* Product Name */}
          <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 flex-1 group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-xl font-bold text-red-600">
              ₹{finalPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
