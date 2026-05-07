// app/products/[product]/page.tsx
export const dynamic = 'force-dynamic';
import { getProductBySlug, getRelatedProducts } from '@/lib/actions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import ReviewsSection from '@/components/ReviewsSection';
import { ProductVariantShell } from '@/components/ProductVariantShell';
import { parseSizes } from '@/lib/parseSizes';

interface PageProps {
  params: Promise<{ product: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { product: productSlug } = await params;
  const product = await getProductBySlug(productSlug);

  if (!product) return notFound();

  const relatedProducts = await getRelatedProducts(product.id, product.category.id, 4);

  const avgRating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
      : 0;

  const brandName = product.brand?.name ?? product.bike?.brand.name ?? 'General';
  const sizes = parseSizes(product.sizes);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-4 pt-28">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-red-600 transition-colors font-medium">Home</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link href={`/categories/${product.category.slug}`} className="hover:text-red-600 transition-colors font-medium">
              {product.category.name}
            </Link>
            {product.bike && (
              <>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <Link href={`/bikes/${product.bike.slug}`} className="hover:text-red-600 transition-colors font-medium">
                  {product.bike.name}
                </Link>
              </>
            )}
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-semibold truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-8">
        <div className="grid lg:grid-cols-2 gap-8 xl:gap-12 mb-12">
          {/* ProductVariantShell renders both the sticky gallery (left) and all details (right) */}
          <ProductVariantShell
            baseProduct={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: Number(product.price),
              salePrice: product.salePrice ? Number(product.salePrice) : null,
              thumbnail: product.thumbnail,
              images: product.images,
              stock: product.stock,
              discount: 0, // computed internally
              brandName,
              hasSize: product.hasSize,
              sizes,
              sku: product.sku,
              avgRating,
              reviewCount: product.reviews.length,
              bikeName: product.bike?.name,
            }}
            colorVariants={product.colorVariants}
          />
        </div>

        {/* Description & Specifications */}
<div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 mb-10 border border-gray-100">
  {(() => {
    const specs = [
      { label: 'Weight',     value: product.weight     ? `${Number(product.weight)} kg` : null },
      { label: 'Color',      value: product.color      ?? null },
      { label: 'Size',       value: product.size       ?? null },
      { label: 'Material',   value: product.material   ?? null },
      { label: 'Dimensions', value: product.dimensions ?? null },
    ].filter((s) => s.value);

    return (
      <div className={`grid gap-8 ${specs.length > 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'}`}>
        {/* Description */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3 ">
            <span className="w-1.5 h-7 bg-gradient-to-b from-red-600 to-red-400 rounded-full" />
            Description
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed text-justify">{product.description}</p>
        </div>

        {/* Specifications — only rendered if at least one value exists */}
        {specs.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3 ">
              <span className="w-1.5 h-7 bg-gradient-to-b from-red-600 to-red-400 rounded-full" />
              Specifications
            </h2>
            <div className="space-y-3">
              {specs.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">{label}</span>
                  <span className="text-sm font-bold text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  })()}
</div>

        {/* Reviews */}
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
                <span className="w-1.5 h-7 bg-gradient-to-b from-red-600 to-red-400 rounded-full" />
                You May Also Like
              </h2>
              <Link href={`/categories/${product.category.slug}`} className="text-red-600 hover:text-red-700 font-bold text-sm flex items-center gap-2 group">
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
                const relatedBrandName = related.brand?.name ?? related.bike?.brand.name ?? null;

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
                      <Image src={related.thumbnail} alt={related.name} fill className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      {relatedBrandName && (
                        <p className="text-xs font-semibold text-red-500 mb-1 uppercase tracking-wide">{relatedBrandName}</p>
                      )}
                      <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-red-600 transition-colors">
                        {related.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {relatedSalePrice ? (
                          <>
                            <span className="text-lg font-bold text-red-600">Rs. {relatedSalePrice.toLocaleString()}</span>
                            <span className="text-sm text-gray-400 line-through">Rs. {relatedPrice.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">Rs. {relatedPrice.toLocaleString()}</span>
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