'use client';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Tag,
  Package,
  Grid3x3,
  List,
  Bike,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnail: string;
  stock: number;
  category: { name: string };
  bike: { name: string; brand: { name: string } } | null;
  brand: { name: string } | null;
}

interface BikeProductsClientProps {
  bike: {
    name: string;
    brandName: string;
    description: string | null;
  };
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

interface FilterTagProps {
  label: string;
  icon?: React.ReactNode;
  onRemove: () => void;
}

interface ProductCardProps {
  product: Product;
  viewMode: 'grid-3' | 'grid-4' | 'list';
  onProductClick: (slug: string) => void;
}

interface FilterSidebarProps {
  filterOptions: {
    categories: string[];
    brands: string[];
    priceRange: [number, number];
  };
  selectedBrands: string[];
  selectedCategories: string[];
  inStockOnly: boolean;
  onSaleOnly: boolean;
  lowStockOnly: boolean;
  priceRange: [number, number];
  expandedSections: {
    brand: boolean;
    category: boolean;
    price: boolean;
    availability: boolean;
  };
  setSelectedBrands: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  setInStockOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setOnSaleOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setLowStockOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setPriceRange: React.Dispatch<React.SetStateAction<[number, number]>>;
  setExpandedSections: React.Dispatch<
    React.SetStateAction<{
      brand: boolean;
      category: boolean;
      price: boolean;
      availability: boolean;
    }>
  >;
}

const ITEMS_PER_PAGE = 12;

// ─── FilterSidebar ────────────────────────────────────────────────────────────

function FilterSidebar({
  filterOptions,
  selectedBrands,
  selectedCategories,
  inStockOnly,
  onSaleOnly,
  lowStockOnly,
  priceRange,
  expandedSections,
  setSelectedBrands,
  setSelectedCategories,
  setInStockOnly,
  setOnSaleOnly,
  setLowStockOnly,
  setPriceRange,
  setExpandedSections,
}: FilterSidebarProps) {
  return (
    <>
      {filterOptions.brands.length > 0 && (
        <FilterSection
          title="Brand"
          icon={<Tag className="w-4 h-4" />}
          isExpanded={expandedSections.brand}
          onToggle={() =>
            setExpandedSections((p) => ({ ...p, brand: !p.brand }))
          }
          count={selectedBrands.length}
        >
          <div className="space-y-2">
            {filterOptions.brands.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-3 cursor-pointer hover:bg-neutral-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={(e) =>
                    setSelectedBrands((p) =>
                      e.target.checked
                        ? [...p, brand]
                        : p.filter((b) => b !== brand),
                    )
                  }
                  className="w-4 h-4 accent-black rounded focus:ring-yellow-400"
                />
                <span className="text-sm text-black">{brand}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection
        title="Category"
        icon={<Package className="w-4 h-4" />}
        isExpanded={expandedSections.category}
        onToggle={() =>
          setExpandedSections((p) => ({ ...p, category: !p.category }))
        }
        count={selectedCategories.length}
      >
        <div className="space-y-2">
          {filterOptions.categories.map((category) => (
            <label
              key={category}
              className="flex items-center gap-3 cursor-pointer hover:bg-neutral-50 p-2 rounded"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={(e) =>
                  setSelectedCategories((p) =>
                    e.target.checked
                      ? [...p, category]
                      : p.filter((c) => c !== category),
                  )
                }
                className="w-4 h-4 accent-black rounded focus:ring-yellow-400"
              />
              <span className="text-sm text-black">{category}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection
        title="Price Range"
        icon={<span className="font-bold text-sm">₹</span>}
        isExpanded={expandedSections.price}
        onToggle={() =>
          setExpandedSections((p) => ({ ...p, price: !p.price }))
        }
      >
        <div className="space-y-4">
          <input
            type="range"
            min={filterOptions.priceRange[0]}
            max={filterOptions.priceRange[1]}
            step="500"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], parseInt(e.target.value)])
            }
            className="w-full accent-black"
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={priceRange[0]}
              onChange={(e) =>
                setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded text-sm text-black focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="Min"
            />
            <span className="text-neutral-500 self-center">-</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={(e) =>
                setPriceRange([
                  priceRange[0],
                  parseInt(e.target.value) || 100000,
                ])
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded text-sm text-black focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              placeholder="Max"
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection
        title="Availability"
        icon={<Bike className="w-4 h-4" />}
        isExpanded={expandedSections.availability}
        onToggle={() =>
          setExpandedSections((p) => ({
            ...p,
            availability: !p.availability,
          }))
        }
        count={
          (inStockOnly ? 1 : 0) + (onSaleOnly ? 1 : 0) + (lowStockOnly ? 1 : 0)
        }
      >
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer hover:bg-neutral-50 p-2 rounded">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 accent-black rounded focus:ring-yellow-400"
            />
            <span className="text-sm text-black">In Stock Only</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer hover:bg-neutral-50 p-2 rounded">
            <input
              type="checkbox"
              checked={onSaleOnly}
              onChange={(e) => setOnSaleOnly(e.target.checked)}
              className="w-4 h-4 accent-black rounded focus:ring-yellow-400"
            />
            <span className="text-sm text-black">On Sale</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer hover:bg-neutral-50 p-2 rounded">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="w-4 h-4 accent-black rounded focus:ring-yellow-400"
            />
            <span className="text-sm text-black">Limited Stock</span>
          </label>
        </div>
      </FilterSection>
    </>
  );
}

// ─── Pagination Component ─────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Build page number list with ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('ellipsis');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('ellipsis');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-neutral-200 pt-6">
      <p className="text-sm text-neutral-600 font-mono">
        Showing <span className="font-semibold text-black">{startItem}–{endItem}</span>{' '}
        of <span className="font-semibold text-black">{totalItems}</span> products
      </p>

      <div className="flex items-center gap-1">
        {/* Prev */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-black hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, idx) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-2 text-neutral-400 text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === page
                    ? 'bg-black text-yellow-400 shadow-sm border border-yellow-400'
                    : 'text-black hover:bg-neutral-100'
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-black hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BikeProductsClient({
  bike,
  products,
}: BikeProductsClientProps) {
  const router = useRouter();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid-3' | 'grid-4' | 'list'>('grid-4');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSections, setExpandedSections] = useState({
    brand: true,
    category: true,
    price: true,
    availability: true,
  });

  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const brands = new Set<string>();
    let minPrice = Infinity, maxPrice = 0;

    products.forEach((p) => {
      categories.add(p.category.name);
      const brandName = p.brand?.name ?? p.bike?.brand.name;
      if (brandName) brands.add(brandName);
      const price = p.salePrice ?? p.price;
      minPrice = Math.min(minPrice, price);
      maxPrice = Math.max(maxPrice, price);
    });

    return {
      categories: Array.from(categories).sort(),
      brands: Array.from(brands).sort(),
      priceRange: [Math.floor(minPrice), Math.ceil(maxPrice)] as [number, number],
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.name.toLowerCase().includes(query),
      );
    }

    filtered = filtered.filter((p) => {
      const price = p.salePrice ?? p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) =>
        selectedCategories.includes(p.category.name),
      );
    }

    if (selectedBrands.length > 0) {
      filtered = filtered.filter((p) => {
        const brandName = p.brand?.name ?? p.bike?.brand.name;
        return brandName ? selectedBrands.includes(brandName) : false;
      });
    }

    if (inStockOnly) filtered = filtered.filter((p) => p.stock > 0);
    if (onSaleOnly)
      filtered = filtered.filter(
        (p) => p.salePrice !== null && p.salePrice < p.price,
      );
    if (lowStockOnly)
      filtered = filtered.filter((p) => p.stock > 0 && p.stock < 10);

    switch (sortBy) {
      case 'price-low':
        filtered.sort(
          (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price),
        );
        break;
      case 'price-high':
        filtered.sort(
          (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price),
        );
        break;
      case 'name-az':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-za':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'discount':
        filtered.sort((a, b) => {
          const discountA = a.salePrice
            ? ((a.price - a.salePrice) / a.price) * 100
            : 0;
          const discountB = b.salePrice
            ? ((b.price - b.salePrice) / b.price) * 100
            : 0;
          return discountB - discountA;
        });
        break;
    }

    return filtered;
  }, [
    products,
    searchQuery,
    priceRange,
    selectedCategories,
    selectedBrands,
    inStockOnly,
    onSaleOnly,
    lowStockOnly,
    sortBy,
  ]);

  // Reset to page 1 whenever filters change
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount =
    selectedCategories.length +
    selectedBrands.length +
    (inStockOnly ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    (lowStockOnly ? 1 : 0) +
    (priceRange[0] > filterOptions.priceRange[0] ||
    priceRange[1] < filterOptions.priceRange[1]
      ? 1
      : 0) +
    (searchQuery.trim() ? 1 : 0);

  const clearAllFilters = () => {
    setPriceRange(filterOptions.priceRange);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setLowStockOnly(false);
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Reset page on any filter/sort change
  const resetPage = () => setCurrentPage(1);

  const removeFilter = (type: string, value?: string) => {
    switch (type) {
      case 'category':
        setSelectedCategories((prev) => prev.filter((c) => c !== value));
        break;
      case 'brand':
        setSelectedBrands((prev) => prev.filter((b) => b !== value));
        break;
      case 'inStock':
        setInStockOnly(false);
        break;
      case 'onSale':
        setOnSaleOnly(false);
        break;
      case 'lowStock':
        setLowStockOnly(false);
        break;
      case 'price':
        setPriceRange(filterOptions.priceRange);
        break;
      case 'search':
        setSearchQuery('');
        break;
    }
    resetPage();
  };

  const handleProductClick = (productSlug: string) => {
    router.push(`/products/${productSlug}`);
  };

  const filterSidebarProps: FilterSidebarProps = {
    filterOptions,
    selectedBrands,
    selectedCategories,
    inStockOnly,
    onSaleOnly,
    lowStockOnly,
    priceRange,
    expandedSections,
    setSelectedBrands: (v) => { setSelectedBrands(v); resetPage(); },
    setSelectedCategories: (v) => { setSelectedCategories(v); resetPage(); },
    setInStockOnly: (v) => { setInStockOnly(v); resetPage(); },
    setOnSaleOnly: (v) => { setOnSaleOnly(v); resetPage(); },
    setLowStockOnly: (v) => { setLowStockOnly(v); resetPage(); },
    setPriceRange: (v) => { setPriceRange(v); resetPage(); },
    setExpandedSections,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner */}
      <div className="relative bg-black overflow-hidden mt-24">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, #facc15 0px, #facc15 2px, transparent 2px, transparent 40px)',
          }}
        />
        <div className="relative max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-2 text-sm mb-4 text-neutral-400 font-mono">
            <Link href="/" className="hover:text-yellow-400 transition-colors">Home</Link>
            <ChevronDown className="w-4 h-4 -rotate-90" />
            <Link href={`/brands/${bike.brandName.toLowerCase()}`} className="hover:text-yellow-400 transition-colors">
              {bike.brandName}
            </Link>
            <ChevronDown className="w-4 h-4 -rotate-90" />
            <span className="font-medium text-yellow-400">{bike.name}</span>
          </div>
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-yellow-400 font-bold text-sm uppercase tracking-[0.25em] mb-2 font-mono">
                {bike.brandName}
              </p>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white italic -skew-x-3 mb-3">
                {bike.name}
              </h1>
              <div className="h-1.5 w-20 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full skew-x-[-20deg] mb-4" />
              {bike.description && (
                <p className="text-lg text-neutral-300 max-w-2xl">{bike.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 text-black"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); resetPage(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-neutral-900 border border-transparent hover:border-yellow-400 lg:hidden"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-xs font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <div className="text-sm text-neutral-700 font-mono">
                <span className="font-bold text-lg text-black">
                  {filteredProducts.length}
                </span>{' '}
                of {products.length} products
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); resetPage(); }}
                className="px-4 py-2.5 pr-10 border border-neutral-300 rounded-lg text-sm font-medium min-w-[180px] text-black focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-az">Name: A to Z</option>
                <option value="name-za">Name: Z to A</option>
                <option value="discount">Highest Discount</option>
              </select>

              <div className="hidden sm:flex gap-1 border border-neutral-300 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid-3')}
                  className={`p-2 rounded ${viewMode === 'grid-3' ? 'bg-black text-yellow-400' : 'text-neutral-600 hover:bg-neutral-100'}`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid-4')}
                  className={`p-2 rounded ${viewMode === 'grid-4' ? 'bg-black text-yellow-400' : 'text-neutral-600 hover:bg-neutral-100'}`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="3" y="3" width="7" height="7" strokeWidth="2" />
                    <rect x="14" y="3" width="7" height="7" strokeWidth="2" />
                    <rect x="3" y="14" width="7" height="7" strokeWidth="2" />
                    <rect x="14" y="14" width="7" height="7" strokeWidth="2" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-black text-yellow-400' : 'text-neutral-600 hover:bg-neutral-100'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters Bar */}
        {activeFiltersCount > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-black">Active Filters</h3>
              <button
                onClick={clearAllFilters}
                className="text-sm text-black hover:text-yellow-600 font-medium underline decoration-yellow-400 underline-offset-4"
              >
                Clear All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchQuery && (
                <FilterTag
                  label={`Search: "${searchQuery}"`}
                  onRemove={() => removeFilter('search')}
                />
              )}
              {selectedBrands.map((brand) => (
                <FilterTag
                  key={brand}
                  label={brand}
                  icon={<Tag className="w-3 h-3" />}
                  onRemove={() => removeFilter('brand', brand)}
                />
              ))}
              {selectedCategories.map((cat) => (
                <FilterTag
                  key={cat}
                  label={cat}
                  icon={<Package className="w-3 h-3" />}
                  onRemove={() => removeFilter('category', cat)}
                />
              ))}
              {inStockOnly && (
                <FilterTag label="In Stock" onRemove={() => removeFilter('inStock')} />
              )}
              {onSaleOnly && (
                <FilterTag label="On Sale" onRemove={() => removeFilter('onSale')} />
              )}
              {lowStockOnly && (
                <FilterTag label="Low Stock" onRemove={() => removeFilter('lowStock')} />
              )}
              {(priceRange[0] > filterOptions.priceRange[0] ||
                priceRange[1] < filterOptions.priceRange[1]) && (
                <FilterTag
                  label={`₹${priceRange[0].toLocaleString()} - ₹${priceRange[1].toLocaleString()}`}
                  onRemove={() => removeFilter('price')}
                />
              )}
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 sticky top-24">
              <div className="p-4 border-b border-neutral-200 bg-black rounded-t-lg">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <SlidersHorizontal className="w-5 h-5 text-yellow-400" />
                  Filters
                </h2>
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
                <FilterSidebar {...filterSidebarProps} />
              </div>
            </div>
          </aside>

          {/* Mobile Filters Drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-xl flex flex-col">
                <div className="p-4 border-b border-neutral-200 bg-black flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                    <SlidersHorizontal className="w-5 h-5 text-yellow-400" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <span className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-neutral-800 rounded-lg text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <FilterSidebar {...filterSidebarProps} />
                </div>
                <div className="p-4 border-t border-neutral-200 flex gap-3">
                  <button
                    onClick={clearAllFilters}
                    className="flex-1 px-4 py-2.5 border border-neutral-300 text-black rounded-lg hover:bg-neutral-50 font-medium text-sm"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 px-4 py-2.5 bg-black text-yellow-400 rounded-lg hover:bg-neutral-900 border border-transparent hover:border-yellow-400 font-medium text-sm"
                  >
                    Show {filteredProducts.length} Results
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <main className="flex-1 min-w-0">
            {paginatedProducts.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === 'grid-3'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                      : viewMode === 'grid-4'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-4'
                  }
                >
                  {paginatedProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      viewMode={viewMode}
                      onProductClick={handleProductClick}
                    />
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  totalItems={filteredProducts.length}
                  itemsPerPage={ITEMS_PER_PAGE}
                />
              </>
            ) : (
              <div className="bg-white rounded-xl shadow p-12 text-center border border-neutral-200">
                <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-12 h-12 text-yellow-400" />
                </div>
                <h3 className="text-xl font-black uppercase text-black mb-2">
                  No Products Found
                </h3>
                <p className="text-neutral-500 mb-4">Try adjusting your filters</p>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-neutral-900 border border-transparent hover:border-yellow-400 font-bold uppercase text-sm"
                  >
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterSection({
  title,
  icon,
  isExpanded,
  onToggle,
  count,
  children,
}: FilterSectionProps) {
  return (
    <div className="border-b border-neutral-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-neutral-50"
      >
        <div className="flex items-center gap-2">
          <span className="text-black">{icon}</span>
          <span className="font-semibold text-black">{title}</span>
          {count != null && count > 0 && (
            <span className="bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full font-bold">
              {count}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-400" />
        )}
      </button>
      {isExpanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function FilterTag({ label, icon, onRemove }: FilterTagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-yellow-400 text-sm rounded-full font-mono">
      {icon}
      {label}
      <button onClick={onRemove} className="hover:bg-neutral-800 rounded-full p-0.5">
        <X className="w-3.5 h-3.5" />
      </button>
    </span>
  );
}

function ProductCard({ product, viewMode, onProductClick }: ProductCardProps) {
  const finalPrice = product.salePrice ?? product.price;
  const hasDiscount =
    product.salePrice !== null && product.salePrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - finalPrice) / product.price) * 100)
    : 0;

  const brandName = product.brand?.name ?? product.bike?.brand.name ?? null;

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onProductClick(product.slug)}
        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-neutral-200 hover:border-yellow-400 overflow-hidden group cursor-pointer"
      >
        <div className="flex gap-4 p-4">
          <div className="relative w-32 h-32 flex-shrink-0 bg-neutral-100 rounded-lg overflow-hidden">
            <Image
              src={product.thumbnail}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
            />
            {hasDiscount && (
              <span className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
                -{discountPercent}%
              </span>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1 font-mono">
                <span className="font-medium text-neutral-700">
                  {product.category.name}
                </span>
                {brandName && (
                  <>
                    <span>·</span>
                    <span className="font-medium text-yellow-600">{brandName}</span>
                  </>
                )}
              </div>
              <h3 className="font-bold text-black mb-2 group-hover:text-yellow-600 transition-colors line-clamp-2">
                {product.name}
              </h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-black tabular-nums">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-neutral-400 line-through tabular-nums">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              {product.stock > 0 ? (
                <span className="text-sm text-black font-medium flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  In Stock
                </span>
              ) : (
                <span className="text-sm text-neutral-400 font-medium">
                  Out of Stock
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onProductClick(product.slug)}
      className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-all border border-neutral-200 hover:border-yellow-400 overflow-hidden group h-full flex flex-col cursor-pointer"
    >
      <div className="relative aspect-square bg-neutral-100 overflow-hidden">
        <Image
          src={product.thumbnail}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform"
        />
        {hasDiscount && (
          <span className="absolute top-3 left-3 bg-gradient-to-r from-yellow-400 to-yellow-300 text-black text-xs font-bold px-3 py-1 rounded-full shadow">
            -{discountPercent}%
          </span>
        )}
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute top-3 right-3 bg-black text-yellow-400 text-xs font-semibold px-3 py-1 rounded-full shadow">
            Only {product.stock} left
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-3 right-3 bg-neutral-800 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
            Out of Stock
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2 text-xs text-neutral-500 font-mono">
          <span className="font-medium text-neutral-700">
            {product.category.name}
          </span>
          {brandName && (
            <>
              <span>·</span>
              <span className="font-medium text-yellow-600 truncate">
                {brandName}
              </span>
            </>
          )}
        </div>
        <h3 className="text-base font-bold text-black mb-3 line-clamp-2 flex-1 group-hover:text-yellow-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-auto">
          <span className="text-xl font-black text-black tabular-nums">
            ₹{finalPrice.toLocaleString('en-IN')}
          </span>
          {hasDiscount && (
            <span className="text-sm text-neutral-400 line-through tabular-nums">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}