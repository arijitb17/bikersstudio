// app/products/[product]/page.tsx
export const dynamic = 'force-dynamic'
import { getProductBySlug, getRelatedProducts } from '@/lib/actions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Truck, Shield, RefreshCw, Package, ChevronRight } from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton';
import ProductImageGallery from '@/components/ProductImageGallery';
import ReviewsSection from '@/components/ReviewsSection';
import ShareButton from '@/components/ShareButton';

interface PageProps {
  params: Promise<{ product: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { product: productSlug } = await params;
  const product = await getProductBySlug(productSlug);

  if (!product) {
    return notFound();
  }

  const relatedProducts = await getRelatedProducts(
    product.id,
    product.categoryId,
    4
  );

  const price = Number(product.price);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const discount = salePrice
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-4 pt-28">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-red-600 transition-colors font-medium">
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link 
              href={`/categories/${product.category.slug}`} 
              className="hover:text-red-600 transition-colors font-medium"
            >
              {product.category.name}
            </Link>
            {product.bike && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <Link 
                  href={`/bikes/${product.bike.slug}`} 
                  className="hover:text-red-600 transition-colors font-medium"
                >
                  {product.bike.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-semibold truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 mb-12">
          {/* Image Gallery - Enhanced for stock photos */}
          <div className="lg:sticky lg:top-24 h-fit">
            <ProductImageGallery 
              images={product.images}
              thumbnail={product.thumbnail}
              productName={product.name}
              discount={discount}
            />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Brand Badge */}
            {product.bike && (
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-50 to-orange-50 text-red-600 px-3 py-1.5 rounded-full font-bold text-sm border border-red-200">
                <Package className="w-4 h-4" />
                {product.bike.brand.name} {product.bike.name}
              </div>
            )}

            {/* Product Title */}
            <div>
              <h1 className="text-3xl xl:text-4xl font-bold text-gray-900 mb-3 leading-tight">
                {product.name}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(avgRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {avgRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  {product.reviews.length} {product.reviews.length === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
              <div className="flex items-baseline gap-3 mb-1">
                {salePrice ? (
                  <>
                    <span className="text-4xl font-bold text-red-600">
                      Rs. {salePrice.toLocaleString()}
                    </span>
                    <span className="text-xl text-gray-400 line-through">
                      Rs. {price.toLocaleString()}
                    </span>
                    <span className="bg-red-600 text-white px-2.5 py-1 rounded-full font-bold text-sm">
                      Save {discount}%
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-gray-900">
                    Rs. {price.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">Inclusive of all taxes</p>
            </div>

            {/* Stock Status */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
              {product.stock > 0 ? (
                <div className="flex items-center gap-3 text-green-700">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-bold text-sm">In Stock</span>
                  <span className="text-sm text-green-600">({product.stock} units available)</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-red-600">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                  <span className="font-bold text-sm">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Truck className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-0.5">Free Delivery</p>
                  <p className="text-xs text-gray-600">Orders above Rs. 500</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-0.5">Warranty</p>
                  <p className="text-xs text-gray-600">1 Year Coverage</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RefreshCw className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-0.5">Easy Returns</p>
                  <p className="text-xs text-gray-600">7 Days Policy</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-0.5">Secure Pack</p>
                  <p className="text-xs text-gray-600">Safe Delivery</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <div className="flex-1">
                <AddToCartButton
                  product={{
                    id: product.id,
                    name: product.name,
                    price: price,
                    salePrice: salePrice,
                    thumbnail: product.thumbnail,
                    brandName: product.bike?.brand.name || 'General',
                  }}
                />
              </div>
              <ShareButton 
                productName={product.name}
                productUrl={`/products/${product.slug}`}
              />
            </div>

            {/* SKU */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                SKU: <span className="font-semibold text-gray-700">{product.sku}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Description & Specifications */}
        <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 mb-10 border border-gray-100">
          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-1.5 h-7 bg-gradient-to-b from-red-600 to-red-400 rounded-full"></span>
                Description
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <span className="w-1.5 h-7 bg-gradient-to-b from-red-600 to-red-400 rounded-full"></span>
                Specifications
              </h2>
              <div className="space-y-3">
                {product.weight && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">Weight</span>
                    <span className="text-sm font-bold text-gray-900">{Number(product.weight)} kg</span>
                  </div>
                )}
                {product.color && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">Color</span>
                    <span className="text-sm font-bold text-gray-900">{product.color}</span>
                  </div>
                )}
                {product.size && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">Size</span>
                    <span className="text-sm font-bold text-gray-900">{product.size}</span>
                  </div>
                )}
                {product.material && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">Material</span>
                    <span className="text-sm font-bold text-gray-900">{product.material}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">Dimensions</span>
                    <span className="text-sm font-bold text-gray-900">{product.dimensions}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-10">
          <ReviewsSection 
            productId={product.id}
            reviews={product.reviews}
            averageRating={avgRating}
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <span className="w-1.5 h-7 bg-gradient-to-b from-red-600 to-red-400 rounded-full"></span>
                You May Also Like
              </h2>
              <Link 
                href={`/categories/${product.category.slug}`}
                className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-2 group"
              >
                View All
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProducts.map((related) => {
                const relatedSalePrice = related.salePrice;
                const relatedPrice = related.price;
                const relatedDiscount = relatedSalePrice
                  ? Math.round(((relatedPrice - relatedSalePrice) / relatedPrice) * 100)
                  : 0;

                return (
                  <Link
                    key={related.id}
                    href={`/products/${related.slug}`}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-red-200"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                      {relatedDiscount > 0 && (
                        <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg">
                          {relatedDiscount}% OFF
                        </div>
                      )}
                      <Image
                        src={related.thumbnail}
                        alt={related.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-red-600 transition-colors">
                        {related.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {relatedSalePrice ? (
                          <>
                            <span className="text-lg font-bold text-red-600">
                              Rs. {relatedSalePrice.toLocaleString()}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              Rs. {relatedPrice.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            Rs. {relatedPrice.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}