"use client";

import { useState, useMemo } from 'react';
import { SlidersHorizontal, X, Grid3x3, List, ChevronDown, ChevronUp, Search, Filter, Tag, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  salePrice?: number | null;
  thumbnail: string;
  stock: number;
  category: { name: string };
  brand?: { name: string } | null;
  bike?: { name: string; brand: { name: string } } | null;
}
interface Category {
  name: string;
  description?: string;
  products: Product[];
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  count?: number;
  children: React.ReactNode;
}

interface ProductCardProps {
  product: Product;
  viewMode: 'grid-3' | 'grid-4' | 'list';
}

export default function EnhancedCategoryPage({ category }: { category: Category }) {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid-3' | 'grid-4' | 'list'>('grid-4');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedBikes, setSelectedBikes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    brand: true, bike: true, price: true, availability: true
  });

  const filterOptions = useMemo(() => {
    const brands = new Set<string>();
    const bikes = new Set<string>();
    let minPrice = Infinity, maxPrice = 0;

    category.products.forEach((p) => {
      const brandName = p.brand?.name ?? p.bike?.brand.name;
      if (brandName) brands.add(brandName);
      if (p.bike?.name) bikes.add(`${p.bike.brand.name} ${p.bike.name}`);
      const price = p.salePrice || p.price;
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    });

    return {
      brands: Array.from(brands).sort(),
      bikes: Array.from(bikes).sort(),
      priceRange: [Math.floor(minPrice), Math.ceil(maxPrice)] as [number, number]
    };
  }, [category.products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...category.products];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.name.toLowerCase().includes(query) ||
        p.bike?.name.toLowerCase().includes(query) ||
        (p.brand?.name ?? p.bike?.brand.name)?.toLowerCase().includes(query)
      );
    }

    filtered = filtered.filter((p) => {
      const price = p.salePrice || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (selectedBrands.length > 0) {
  filtered = filtered.filter((p) => {
    const brandName = p.brand?.name ?? p.bike?.brand.name;
    return brandName ? selectedBrands.includes(brandName) : false;
  });
}

    if (selectedBikes.length > 0) {
      filtered = filtered.filter((p) => p.bike && selectedBikes.includes(`${p.bike.brand.name} ${p.bike.name}`));
    }

    if (inStockOnly) filtered = filtered.filter((p) => p.stock > 0);
    if (onSaleOnly) filtered = filtered.filter((p) => p.salePrice != null && p.salePrice < p.price);
    if (lowStockOnly) filtered = filtered.filter((p) => p.stock > 0 && p.stock < 10);

    switch (sortBy) {
      case 'price-low': filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price)); break;
      case 'price-high': filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price)); break;
      case 'name-az': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-za': filtered.sort((a, b) => b.name.localeCompare(a.name)); break;
    }

    return filtered;
  }, [category.products, searchQuery, priceRange, selectedBrands, selectedBikes, inStockOnly, onSaleOnly, lowStockOnly, sortBy]);

  const activeFiltersCount =
    selectedBrands.length + selectedBikes.length +
    (inStockOnly ? 1 : 0) + (onSaleOnly ? 1 : 0) + (lowStockOnly ? 1 : 0) +
    (priceRange[0] > filterOptions.priceRange[0] || priceRange[1] < filterOptions.priceRange[1] ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setPriceRange(filterOptions.priceRange);
    setSelectedBrands([]);
    setSelectedBikes([]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setLowStockOnly(false);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white py-16 mt-24">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm mb-4 text-white/90">
            <span>Home</span><ChevronDown className="w-4 h-4 -rotate-90" /><span>Shop</span>
            <ChevronDown className="w-4 h-4 -rotate-90" />
            <span className="font-medium text-white">{category.name}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-white">{category.name}</h1>
          {category.description && <p className="text-lg text-white/95">{category.description}</p>}
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 lg:hidden"
              >
                <Filter className="w-4 h-4" />Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-white text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">{activeFiltersCount}</span>
                )}
              </button>
              <div className="text-sm text-gray-700">
                <span className="font-bold text-lg text-gray-900">{filteredProducts.length}</span> of {category.products.length} products
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 pr-10 border border-gray-300 rounded-lg text-sm font-medium min-w-[180px] text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
                <option value="name-za">Name: Z to A</option>
              </select>

              <div className="hidden sm:flex gap-1 border border-gray-300 rounded-lg p-1">
                <button onClick={() => setViewMode('grid-3')} className={`p-2 rounded ${viewMode === 'grid-3' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('grid-4')} className={`p-2 rounded ${viewMode === 'grid-4' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" strokeWidth="2"/>
                    <rect x="3" y="14" width="7" height="7" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" strokeWidth="2"/>
                  </svg>
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {activeFiltersCount > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Active Filters</h3>
              <button onClick={clearAllFilters} className="text-sm text-red-600 hover:text-red-700 font-medium">Clear All</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                  Search: &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedBrands.map(b => (
                <span key={b} className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                  {b}
                  <button onClick={() => setSelectedBrands(prev => prev.filter(x => x !== b))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-24">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />Filters
                </h2>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <FilterSection
                  title="Brand"
                  icon={<Tag className="w-4 h-4" />}
                  isExpanded={expandedSections.brand}
                  onToggle={() => setExpandedSections(p => ({...p, brand: !p.brand}))}
                  count={selectedBrands.length}
                >
                  <div className="space-y-2">
                    {filterOptions.brands.map(brand => (
                      <label key={brand} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={(e) => setSelectedBrands(p => e.target.checked ? [...p, brand] : p.filter(b => b !== brand))}
                          className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-900">{brand}</span>
                      </label>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection
                  title="Price Range"
                  icon={<span className="font-bold">₹</span>}
                  isExpanded={expandedSections.price}
                  onToggle={() => setExpandedSections(p => ({...p, price: !p.price}))}
                >
                  <div className="space-y-4">
                    <input
                      type="range"
                      min={filterOptions.priceRange[0]}
                      max={filterOptions.priceRange[1]}
                      step="500"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-red-600"
                    />
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-red-500"
                        placeholder="Min"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 100000])}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-red-500"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </FilterSection>

                <FilterSection
                  title="Availability"
                  icon={<Package className="w-4 h-4" />}
                  isExpanded={expandedSections.availability}
                  onToggle={() => setExpandedSections(p => ({...p, availability: !p.availability}))}
                  count={(inStockOnly ? 1 : 0) + (onSaleOnly ? 1 : 0) + (lowStockOnly ? 1 : 0)}
                >
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                      <span className="text-sm text-gray-900">In Stock Only</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input type="checkbox" checked={onSaleOnly} onChange={(e) => setOnSaleOnly(e.target.checked)} className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                      <span className="text-sm text-gray-900">On Sale</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                      <span className="text-sm text-gray-900">Limited Stock</span>
                    </label>
                  </div>
                </FilterSection>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            {filteredProducts.length > 0 ? (
              <div className={
                viewMode === 'grid-3'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : viewMode === 'grid-4'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }>
                {filteredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} viewMode={viewMode} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Products Found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters</p>
                {activeFiltersCount > 0 && (
                  <button onClick={clearAllFilters} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, icon, isExpanded, onToggle, count, children }: FilterSectionProps) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
          {count != null && count > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">{count}</span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>
      {isExpanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function ProductCard({ product, viewMode }: ProductCardProps) {
  const finalPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice != null && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - finalPrice) / product.price) * 100)
    : 0;

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border overflow-hidden group">
        <div className="flex gap-4 p-4">
          <div className="relative w-32 h-32 flex-shrink-0 bg-gray-50 rounded-lg overflow-hidden">
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            {hasDiscount && (
              <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                -{discountPercent}%
              </span>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span className="font-medium text-gray-700">{product.category.name}</span>
                {product.bike && (
                  <>
                    <span>•</span>
                    <span className="text-gray-600">{product.bike.brand.name} {product.bike.name}</span>
                  </>
                )}
              </div>
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-red-600 transition-colors line-clamp-2">
                {product.name}
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">₹{finalPrice.toLocaleString('en-IN')}</span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
                )}
              </div>
              {product.stock > 0
                ? <span className="text-sm text-green-600 font-medium flex items-center gap-1"><div className="w-2 h-2 bg-green-600 rounded-full" />In Stock</span>
                : <span className="text-sm text-red-600 font-medium">Out of Stock</span>
              }
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/products/${product.slug}`} prefetch>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all border overflow-hidden group h-full flex flex-col">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          <Image
            src={product.thumbnail}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
          />
          {hasDiscount && (
            <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
              -{discountPercent}%
            </span>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
              Only {product.stock} left
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-3 right-3 bg-gray-800 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
              Out of Stock
            </span>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
            <span className="font-medium text-gray-700">{product.category.name}</span>
            {product.bike && (
              <>
                <span>•</span>
                <span className="truncate text-gray-600">{product.bike.brand.name} {product.bike.name}</span>
              </>
            )}
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 flex-1 group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-xl font-bold text-gray-900">₹{finalPrice.toLocaleString('en-IN')}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">₹{product.price.toLocaleString('en-IN')}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}