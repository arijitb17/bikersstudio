"use client";
import { useState, useEffect, useRef } from "react";
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

// Fully dynamic — no hardcoded section names
type MenuStructure = Record<string, Record<string, { name: string; slug: string }[]>>;

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnail: string;
}

// Map of JSON key → navbar label
const SECTION_LABELS: Record<string, string> = {
  motorcycleAccessories: "Motorcycle Accessories",
  universalAccessories: "Universal Accessories",
  ridingGears: "Riding Gears",
  helmetsAccessories: "Helmets & Accessories",
  maintenanceCare: "Maintenance & Care",
  tiresWheels: "Tires & Wheels",
};

function MegaMenuGrid({
  data,
  cols = 4,
  onClose,
}: {
  data: Record<string, { name: string; slug: string }[]>;
  cols?: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed left-0 right-0 top-[152px] w-full border-t border-yellow-600/30 shadow-xl z-50 animate-slideDown mega-menu"
      style={{
        maxHeight: "60vh",
        overflowY: "auto",
        background: "linear-gradient(180deg, #f0b414 0%, #e6a800 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
        <div className={`grid grid-cols-${cols} gap-8`}>
          {Object.entries(data).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-bold text-white text-base uppercase tracking-wide border-b border-black/20 pb-2">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/categories/${item.slug}`}
                    className="block text-base text-white/80 hover:text-white hover:pl-2 transition-all"
                    onClick={onClose}
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
  );
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
  const [menuStructure, setMenuStructure] = useState<MenuStructure>({});
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const brandsRes = await fetch("/api/bike-brands");
        if (brandsRes.ok) setBrands(await brandsRes.json());

        const menuRes = await fetch("/api/menu-structure");
        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuStructure(menuData.menuStructure || {});
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
        setShowResults(false);
        return;
      }
      try {
        const res = await fetch(`/api/search?q=${searchQuery}`);
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch (err) {
        console.error("Search failed:", err);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".dropdown-container") && !target.closest(".mega-menu")) {
        setOpenDropdown(null);
      }
      if (!target.closest(".user-menu-container")) setUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownToggle = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const closeAllMenus = () => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setShowResults(false);
  };

  const handleSignOut = () => signOut({ callbackUrl: "/" });

  // Dynamic sections — driven entirely by JSON, skip empty ones
  const menuSections = Object.entries(menuStructure).filter(
    ([, data]) => Object.keys(data).length > 0
  );

  return (
    <nav
  className="fixed top-0 left-0 right-0 z-50 shadow-lg"
  style={{
    background: "linear-gradient(180deg, #111111 0%, #0b0b0b 100%)",
    borderBottom: "1px solid rgba(255, 193, 7, 0.18)",
  }}
>
      {/* Top bar */}
      <div className="border-b border-yellow-600/30">
        <div className="w-full px-6 lg:px-12">
          <div className="flex items-center justify-between h-21">
<Link href="/" className="flex-shrink-0 flex items-center gap-2 sm:gap-2.5 h-full">
  <Image
    src="/logo.png"
    alt="Logo"
    width={226}
    height={353}
    priority
    className="h-14 sm:h-16 md:h-[68px] w-auto object-contain"
  />

</Link>
            <div className="hidden md:flex flex-1 max-w-3xl mx-12">
  <div className="relative w-full" ref={searchRef}>
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onFocus={() => searchResults.length > 0 && setShowResults(true)}
      placeholder="Search products..."
      className="
        w-full
        h-14
        pl-6
        pr-14
        rounded-full
        bg-[#1a1a1a]
        border
        border-yellow-500/25
        text-white
        placeholder:text-gray-400
        text-base
        transition-all
        duration-300
        shadow-lg
        focus:outline-none
        focus:border-yellow-400
        focus:ring-4
        focus:ring-yellow-400/20
      "
    />

    <button className="absolute right-5 top-1/2 -translate-y-1/2">
      <Search className="w-5 h-5 text-yellow-400" />
    </button>

    {showResults && searchResults.length > 0 && (
      <div className="
        absolute
        top-full
        left-0
        mt-3
        w-full
        bg-[#111]
        border
        border-yellow-500/20
        rounded-2xl
        shadow-2xl
        overflow-hidden
        max-h-96
        overflow-y-auto
        z-50
      ">
        {searchResults.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.slug}`}
            className="
              flex
              items-center
              gap-4
              px-5
              py-4
              hover:bg-yellow-500/10
              transition
            "
            onClick={() => {
              setShowResults(false);
              setSearchQuery("");
            }}
          >
            <Image
              src={item.thumbnail}
              alt={item.name}
              width={50}
              height={50}
              className="rounded-lg border border-neutral-700"
            />

            <div className="flex-1">
              <p className="font-semibold text-white">
                {item.name}
              </p>

              <p className="text-yellow-400 font-medium">
                ₹{item.price}
              </p>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>
</div>

            <div className="flex items-center gap-6 min-w-[120px] justify-end">
              <button onClick={openCart} className="relative hidden sm:block hover:scale-110 transition-transform group">
                <ShoppingCart className="w-7 h-7 text-white transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold animate-pulse">
                    {itemCount}
                  </span>
                )}
              </button>

              <div className="relative hidden sm:block user-menu-container">
                {status === "loading" ? (
                  <div className="w-8 h-8 rounded-full bg-white/30 animate-pulse"></div>
                ) : session ? (
                  <div className="relative">
                    <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 hover:scale-110 transition-transform">
                      {session.user.image ? (
                        <Image src={session.user.image} alt={session.user.name || "User"} width={32} height={32} className="rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white text-yellow-800 flex items-center justify-center font-bold text-lg">
                          {session.user.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="font-semibold text-gray-900 text-lg">{session.user.name}</p>
                          <p className="text-sm text-gray-500">{session.user.email}</p>
                        </div>
                        <div className="py-2">
                          <Link href="/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors text-base" onClick={closeAllMenus}><User className="w-4 h-4" /><span>My Profile</span></Link>
                          <Link href="/orders" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors text-base" onClick={closeAllMenus}><Package className="w-4 h-4" /><span>My Orders</span></Link>
                          {session.user.role === "ADMIN" && (
                            <Link href="/admin" className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors text-base" onClick={closeAllMenus}><Settings className="w-4 h-4" /><span>Admin Panel</span></Link>
                          )}
                        </div>
                        <div className="border-t border-gray-100 pt-2">
                          <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors w-full text-base"><LogOut className="w-4 h-4" /><span>Sign Out</span></button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/auth/signin" className="flex items-center gap-2 px-5 py-2.5 bg-white text-yellow-800 rounded-lg hover:bg-yellow-50 transition-colors font-semibold text-lg"><User className="w-5 h-5" />Sign In</Link>
                )}
              </div>

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden hover:bg-black/10 p-2 rounded-lg transition-colors">
                {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation — fully dynamic from JSON */}
      <div className="border-b border-yellow-600/30 hidden md:block">
        <div className="w-full px-6 lg:px-12">
          <div className="flex items-center justify-center gap-8 h-14">

            {/* Shop by Bike — always first */}
            <div className="relative dropdown-container">
              <button
                onClick={() => handleDropdownToggle("brands")}
                className="flex items-center gap-1 text-white hover:text-white/70 font-semibold text-lg transition-colors"
              >
                Shop by Bike
                <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === "brands" ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === "brands" && (
                <div
                  className="fixed left-0 right-0 top-[152px] w-full border-t border-yellow-600/30 shadow-xl z-50 animate-slideDown mega-menu"
                  style={{
                    maxHeight: "60vh",
                    overflowY: "auto",
                    background: "linear-gradient(180deg, #f0b414 0%, #e6a800 100%)",
                  }}
                >
                  <div className="max-w-7xl mx-auto px-6 lg:px-12 py-8">
                    <div className="grid gap-6" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
                      {[...brands].sort((a, b) => b.bikes.length - a.bikes.length).map((brand) => (
                        <div key={brand.slug} className="space-y-3">
                          <Link href={`/brands/${brand.slug}`} className="block font-bold text-white hover:text-white/70 transition-colors text-xl mb-4" onClick={closeAllMenus}>{brand.name}</Link>
                          <div className="space-y-2">
                            {brand.bikes.map((bike) => (
                              <Link key={bike.slug} href={`/bikes/${bike.slug}`} className="block text-base text-white/80 hover:text-white hover:pl-2 transition-all" onClick={closeAllMenus}>{bike.name}</Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic sections from JSON */}
            {menuSections.map(([key, data]) => (
              <div key={key} className="relative dropdown-container">
                <button
                  onClick={() => handleDropdownToggle(key)}
                  className="flex items-center gap-1 text-white hover:text-white/70 font-semibold text-lg transition-colors"
                >
                  {SECTION_LABELS[key] || key.replace(/([A-Z])/g, " $1").trim()}
                  <ChevronDown className={`w-5 h-5 transition-transform ${openDropdown === key ? "rotate-180" : ""}`} />
                </button>
                {openDropdown === key && (
                  <MegaMenuGrid data={data} cols={Object.keys(data).length > 3 ? 4 : 3} onClose={closeAllMenus} />
                )}
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden border-t border-yellow-600/30 max-h-[calc(100vh-80px)] overflow-y-auto"
          style={{ background: "linear-gradient(180deg, #f0b414 0%, #e6a800 100%)" }}
        >
          <div className="px-6 py-4 space-y-4">
            <div className="relative">
              <input type="text" placeholder="Search products..." className="w-full px-4 py-3 pr-12 rounded-lg bg-black/10 text-white placeholder:text-white/70 text-lg focus:outline-none focus:ring-2 focus:ring-black/30" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2"><Search className="w-5 h-5 text-white" /></button>
            </div>

            {session ? (
              <div className="border-b border-black/10 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  {session.user.image ? (
                    <Image src={session.user.image} alt={session.user.name || "User"} width={40} height={40} className="rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white text-yellow-800 flex items-center justify-center font-bold text-xl">{session.user.name?.[0]?.toUpperCase() || "U"}</div>
                  )}
                  <div>
                    <p className="font-semibold text-white text-lg">{session.user.name}</p>
                    <p className="text-base text-white/70">{session.user.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-2 hover:bg-black/10 rounded-lg text-white text-lg" onClick={closeAllMenus}><User className="w-5 h-5" /><span>My Profile</span></Link>
                  <Link href="/orders" className="flex items-center gap-3 px-4 py-2 hover:bg-black/10 rounded-lg text-white text-lg" onClick={closeAllMenus}><Package className="w-5 h-5" /><span>My Orders</span></Link>
                  {session.user.role === "ADMIN" && (
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-2 hover:bg-black/10 rounded-lg text-white text-lg" onClick={closeAllMenus}><Settings className="w-5 h-5" /><span>Admin Panel</span></Link>
                  )}
                  <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2 hover:bg-black/10 rounded-lg text-white w-full text-lg"><LogOut className="w-5 h-5" /><span>Sign Out</span></button>
                </div>
              </div>
            ) : (
              <Link href="/auth/signin" className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-yellow-800 rounded-lg hover:bg-yellow-50 transition-colors font-semibold text-lg" onClick={closeAllMenus}><User className="w-5 h-5" />Sign In</Link>
            )}

            <button onClick={() => { openCart(); closeAllMenus(); }} className="flex items-center justify-between w-full px-4 py-3 hover:bg-black/10 rounded-lg">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-6 h-6 text-white" />
                <span className="font-medium text-white text-lg">Shopping Cart</span>
              </div>
              {itemCount > 0 && <span className="bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-semibold">{itemCount}</span>}
            </button>

            <div className="space-y-4">
              {/* Mobile: Shop by Bike */}
              <div>
                <div className="font-bold text-white mb-3 text-xl">Shop by Bike</div>
                {brands.map((brand) => (
                  <div key={brand.slug} className="mb-4">
                    <Link href={`/brands/${brand.slug}`} className="block font-semibold text-white hover:text-white/70 mb-2 text-lg" onClick={closeAllMenus}>{brand.name}</Link>
                    <div className="pl-4 space-y-1">
                      {brand.bikes.map((bike) => (
                        <Link key={bike.slug} href={`/bikes/${bike.slug}`} className="block text-base text-white/80 hover:text-white py-1" onClick={closeAllMenus}>{bike.name}</Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile: dynamic sections */}
              {menuSections.map(([key, data]) => (
                <div key={key}>
                  <div className="font-bold text-white mb-3 text-xl">
                    {SECTION_LABELS[key] || key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  {Object.entries(data).map(([category, items]) => (
                    <div key={category} className="mb-4">
                      <div className="font-semibold text-white text-base mb-2">{category}</div>
                      <div className="pl-4 space-y-1">
                        {items.map((item) => (
                          <Link key={item.slug} href={`/categories/${item.slug}`} className="block text-base text-white/80 hover:text-white py-1" onClick={closeAllMenus}>{item.name}</Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}