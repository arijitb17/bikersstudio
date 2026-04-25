"use client";
import { useState, useEffect } from "react";
import { Search, ShoppingCart, User, ChevronDown, Menu, X, LogOut, Settings, Package } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartContext";
import { signOut, useSession } from "next-auth/react";

interface Brand {
  name: string;
  slug: string;
  bikes: { name: string; slug: string }[];
}
interface MenuStructure {
  motorcycleAccessories: Record<string, { name: string; slug: string }[]>;
  ridingGears: Record<string, { name: string; slug: string }[]>;
  helmetsAccessories: Record<string, { name: string; slug: string }[]>;
  maintenanceCare: Record<string, { name: string; slug: string }[]>;
  tiresWheels: Record<string, { name: string; slug: string }[]>;
}
interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnail: string;
}
export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
const [showResults, setShowResults] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const { itemCount, openCart } = useCart();
  const { data: session, status } = useSession();
  const [menuStructure, setMenuStructure] = useState<MenuStructure | null>(null);
   useEffect(() => {
    const fetchData = async () => {
      try {
        const brandsRes = await fetch("/api/brands");
        if (brandsRes.ok) {
          const brandsData = await brandsRes.json();
          setBrands(brandsData);
        }

        // ADD THESE LINES - Fetch menu structure
        const menuRes = await fetch("/api/menu-structure");
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuStructure(menuData.menuStructure);
        }
      } catch (error) {
        console.error("Failed to fetch navigation data:", error);
      }
    };
    fetchData();
  }, []);
useEffect(() => {
  const delayDebounce = setTimeout(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${searchQuery}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search failed:", err);
    }
  }, 300);

  return () => clearTimeout(delayDebounce);
}, [searchQuery]);
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container') && !target.closest('.mega-menu')) {
        setOpenDropdown(null);
      }
      if (!target.closest('.user-menu-container')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDropdownToggle = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeAllMenus = () => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const motorcycleAccessories = menuStructure?.motorcycleAccessories || {};
  const ridingGears = menuStructure?.ridingGears || {};
  const helmetsAccessories = menuStructure?.helmetsAccessories || {};
  const maintenanceCare = menuStructure?.maintenanceCare || {};
  const tiresWheels = menuStructure?.tiresWheels || {};

  return (
    <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
      {/* Top bar */}
      <div className="border-b border-gray-200">
        <div className="w-full px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <Link href="/" className="flex-shrink-0 min-w-[120px]">
              <Image
                src="/logo.png"
                alt="Logo"
                width={120}
                height={40}
                className="object-contain"
                priority
              />
            </Link>

            <div className="hidden md:flex flex-1 max-w-3xl mx-12">
              <div className="relative w-full">
                <input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  onFocus={() => setShowResults(true)}
  placeholder="Search products..."
  className="w-full px-6 py-3 pr-12 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 text-gray-700 placeholder:text-gray-500"
/>
                <button className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Search className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
{showResults && searchResults.length > 0 && (
  <div className="absolute top-full mt-2 w-full bg-white shadow-xl rounded-xl border border-gray-200 max-h-80 overflow-y-auto z-50">
    {searchResults.map((item) => (
      <Link
        key={item.id}
        href={`/products/${item.slug}`}
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
        onClick={() => setShowResults(false)}
      >
        <Image
          src={item.thumbnail}
          alt={item.name}
          width={40}
          height={40}
          className="rounded"
        />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {item.name}
          </p>
          <p className="text-xs text-gray-500">
            ₹{item.price}
          </p>
        </div>
      </Link>
    ))}
  </div>
)}
            <div className="flex items-center gap-6 min-w-[120px] justify-end">
              <button
                onClick={openCart}
                className="relative hidden sm:block hover:scale-110 transition-transform group"
              >
                <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-red-600 transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold animate-pulse">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* User Menu */}
              <div className="relative hidden sm:block user-menu-container">
                {status === "loading" ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                ) : session ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 hover:scale-110 transition-transform"
                    >
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                          {session.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </button>

                    {/* User Dropdown */}
                    {userMenuOpen && (
                      <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900">
                            {session.user.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {session.user.email}
                          </p>
                        </div>

                        <div className="py-2">
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                            onClick={closeAllMenus}
                          >
                            <User className="w-4 h-4" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            href="/orders"
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                            onClick={closeAllMenus}
                          >
                            <Package className="w-4 h-4" />
                            <span>My Orders</span>
                          </Link>
                          {session.user.role === "ADMIN" && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
                              onClick={closeAllMenus}
                            >
                              <Settings className="w-4 h-4" />
                              <span>Admin Panel</span>
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-gray-100 pt-2">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth/signin"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <User className="w-4 h-4" />
                    Sign In
                  </Link>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6 text-gray-700" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="border-b border-gray-200 hidden md:block">
        <div className="w-full px-6 lg:px-12">
          <div className="flex items-center justify-center gap-8 h-14">
            {/* Shop by Bike Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle("brands")}
                className="flex items-center gap-1 text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Shop by Bike
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === "brands" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openDropdown === "brands" && (
                <div className="fixed left-0 right-0 top-[134px] w-full bg-white border-t border-gray-200 shadow-xl z-50 animate-slideDown mega-menu">
                  <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                    <div className="grid grid-cols-5 gap-6">
                      {brands.map((brand) => (
                        <div key={brand.slug} className="space-y-3">
                          <Link
                            href={`/brands/${brand.slug}`}
                            className="block font-bold text-gray-900 hover:text-red-600 transition-colors text-lg mb-4"
                            onClick={closeAllMenus}
                          >
                            {brand.name}
                          </Link>
                          <div className="space-y-2">
                            {brand.bikes.map((bike) => (
                              <Link
                                key={bike.slug}
                                href={`/bikes/${bike.slug}`}
                                className="block text-sm text-gray-600 hover:text-red-600 hover:pl-2 transition-all"
                                onClick={closeAllMenus}
                              >
                                {bike.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Motorcycle Accessories Mega Menu */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle("accessories")}
                className="flex items-center gap-1 text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Motorcycle Accessories
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === "accessories" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openDropdown === "accessories" && (
                <div className="fixed left-0 right-0 top-[134px] w-full bg-white border-t border-gray-200 shadow-xl z-50 animate-slideDown mega-menu">
                  <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                    <div className="grid grid-cols-4 gap-8">
                      {Object.entries(motorcycleAccessories).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <Link
                                key={item.slug}
                                href={`/categories/${item.slug}`}
                                className="block text-sm text-gray-600 hover:text-red-600 hover:pl-2 transition-all"
                                onClick={closeAllMenus}
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Riding Gears Mega Menu */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle("riding-gears")}
                className="flex items-center gap-1 text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Riding Gears
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === "riding-gears" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openDropdown === "riding-gears" && (
                <div className="fixed left-0 right-0 top-[134px] w-full bg-white border-t border-gray-200 shadow-xl z-50 animate-slideDown mega-menu">
                  <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                    <div className="grid grid-cols-3 gap-8">
                      {Object.entries(ridingGears).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <Link
                                key={item.slug}
                                href={`/categories/${item.slug}`}
                                className="block text-sm text-gray-600 hover:text-red-600 hover:pl-2 transition-all"
                                onClick={closeAllMenus}
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Helmets & Accessories Mega Menu */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle("helmets")}
                className="flex items-center gap-1 text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Helmets & Accessories
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === "helmets" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openDropdown === "helmets" && (
                <div className="fixed left-0 right-0 top-[134px] w-full bg-white border-t border-gray-200 shadow-xl z-50 animate-slideDown mega-menu">
                  <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                    <div className="grid grid-cols-3 gap-8">
                      {Object.entries(helmetsAccessories).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <Link
                                key={item.slug}
                                href={`/categories/${item.slug}`}
                                className="block text-sm text-gray-600 hover:text-red-600 hover:pl-2 transition-all"
                                onClick={closeAllMenus}
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Maintenance & Care Mega Menu */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle("maintenance")}
                className="flex items-center gap-1 text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Maintenance & Care
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === "maintenance" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openDropdown === "maintenance" && (
                <div className="fixed left-0 right-0 top-[134px] w-full bg-white border-t border-gray-200 shadow-xl z-50 animate-slideDown mega-menu">
                  <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                    <div className="grid grid-cols-3 gap-8">
                      {Object.entries(maintenanceCare).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <Link
                                key={item.slug}
                                href={`/categories/${item.slug}`}
                                className="block text-sm text-gray-600 hover:text-red-600 hover:pl-2 transition-all"
                                onClick={closeAllMenus}
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tires & Wheels Mega Menu */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle("tires")}
                className="flex items-center gap-1 text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Tires & Wheels
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    openDropdown === "tires" ? "rotate-180" : ""
                  }`}
                />
              </button>

              {openDropdown === "tires" && (
                <div className="fixed left-0 right-0 top-[134px] w-full bg-white border-t border-gray-200 shadow-xl z-50 animate-slideDown mega-menu">
                  <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                    <div className="grid grid-cols-3 gap-8">
                      {Object.entries(tiresWheels).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide border-b border-gray-200 pb-2">
                            {category}
                          </h3>
                          <div className="space-y-2">
                            {items.map((item) => (
                              <Link
                                key={item.slug}
                                href={`/categories/${item.slug}`}
                                className="block text-sm text-gray-600 hover:text-red-600 hover:pl-2 transition-all"
                                onClick={closeAllMenus}
                              >
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="px-6 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                className="w-full px-4 py-3 pr-12 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2">
                <Search className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Mobile User Section */}
            {session ? (
              <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-bold">
                      {session.user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{session.user.name}</p>
                    <p className="text-sm text-gray-500">{session.user.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700"
                    onClick={closeAllMenus}
                  >
                    <User className="w-4 h-4" />
                    <span>My Profile</span>
                  </Link>
                  <Link
                    href="/orders"
                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700"
                    onClick={closeAllMenus}
                  >
                    <Package className="w-4 h-4" />
                    <span>My Orders</span>
                  </Link>
                  {session.user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700"
                      onClick={closeAllMenus}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Admin Panel</span>
                    </Link>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 rounded-lg text-red-600 w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                onClick={closeAllMenus}
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}

            {/* Mobile Cart */}
            <button
              onClick={() => {
                openCart();
                closeAllMenus();
              }}
              className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                <span className="font-medium text-gray-700">Shopping Cart</span>
              </div>
              {itemCount > 0 && (
                <span className="bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-semibold">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Navigation Links */}
            <div className="space-y-4">
              {/* Brands */}
              <div>
                <div className="font-bold text-gray-900 mb-3 text-lg">Shop by Bike</div>
                {brands.map((brand) => (
                  <div key={brand.slug} className="mb-4">
                    <Link
                      href={`/brands/${brand.slug}`}
                      className="block font-semibold text-gray-800 hover:text-red-600 mb-2"
                      onClick={closeAllMenus}
                    >
                      {brand.name}
                    </Link>
                    <div className="pl-4 space-y-1">
                      {brand.bikes.map((bike) => (
                        <Link
                          key={bike.slug}
                          href={`/bikes/${bike.slug}`}
                          className="block text-sm text-gray-600 hover:text-red-600 py-1"
                          onClick={closeAllMenus}
                        >
                          {bike.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Motorcycle Accessories */}
              <div>
                <div className="font-bold text-gray-900 mb-3 text-lg">Motorcycle Accessories</div>
                {Object.entries(motorcycleAccessories).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <div className="font-semibold text-gray-800 text-sm mb-2">{category}</div>
                    <div className="pl-4 space-y-1">
                      {items.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/categories/${item.slug}`}
                          className="block text-sm text-gray-600 hover:text-red-600 py-1"
                          onClick={closeAllMenus}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Riding Gears */}
              <div>
                <div className="font-bold text-gray-900 mb-3 text-lg">Riding Gears</div>
                {Object.entries(ridingGears).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <div className="font-semibold text-gray-800 text-sm mb-2">{category}</div>
                    <div className="pl-4 space-y-1">
                      {items.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/categories/${item.slug}`}
                          className="block text-sm text-gray-600 hover:text-red-600 py-1"
                          onClick={closeAllMenus}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Helmets */}
              <div>
                <div className="font-bold text-gray-900 mb-3 text-lg">Helmets & Accessories</div>
                {Object.entries(helmetsAccessories).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <div className="font-semibold text-gray-800 text-sm mb-2">{category}</div>
                    <div className="pl-4 space-y-1">
                      {items.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/categories/${item.slug}`}
                          className="block text-sm text-gray-600 hover:text-red-600 py-1"
                          onClick={closeAllMenus}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Maintenance */}
              <div>
                <div className="font-bold text-gray-900 mb-3 text-lg">Maintenance & Care</div>
                {Object.entries(maintenanceCare).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <div className="font-semibold text-gray-800 text-sm mb-2">{category}</div>
                    <div className="pl-4 space-y-1">
                      {items.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/categories/${item.slug}`}
                          className="block text-sm text-gray-600 hover:text-red-600 py-1"
                          onClick={closeAllMenus}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tires & Wheels */}
              <div>
                <div className="font-bold text-gray-900 mb-3 text-lg">Tires & Wheels</div>
                {Object.entries(tiresWheels).map(([category, items]) => (
                  <div key={category} className="mb-4">
                    <div className="font-semibold text-gray-800 text-sm mb-2">{category}</div>
                    <div className="pl-4 space-y-1">
                      {items.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/categories/${item.slug}`}
                          className="block text-sm text-gray-600 hover:text-red-600 py-1"
                          onClick={closeAllMenus}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
