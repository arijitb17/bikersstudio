// lib/cache.ts
import { redisGet, redisSet, redisDel, redisDeletePattern } from './redis';

/** TTL constants (seconds) */
export const TTL = {
  SHORT: 60,         // 1 minute — frequently changing data
  MEDIUM: 300,       // 5 minutes — semi-static data
  LONG: 1800,        // 30 minutes — rarely changing data
  VERY_LONG: 86400,  // 24 hours — static data
} as const;

/** Cache key factories — centralised so invalidation is always consistent */
export const CacheKey = {
  // Products
  products: (page: number, limit: number) => `products:list:${page}:${limit}`,
  product: (id: string) => `products:item:${id}`,
  productsByCategory: (slug: string, page: number) => `products:cat:${slug}:${page}`,

  // Categories
  categories: () => `categories:list`,
  category: (id: string) => `categories:item:${id}`,

  // Brands
  brands: () => `brands:list`,
  brandsPublic: () => `brands:public`,
  brand: (id: string) => `brands:item:${id}`,

  // Bikes
  bikes: () => `bikes:list`,
  bike: (id: string) => `bikes:item:${id}`,

  // Orders
  userOrders: (userId: string) => `orders:user:${userId}`,
  adminOrders: (page: number, status: string) => `orders:admin:${status}:${page}`,

  // Banners
  banners: () => `banners:list`,

  // Menu
  menuItems: () => `menu:items`,
  menuStructure: () => `menu:structure`,

  // Dashboard
  dashboardStats: () => `dashboard:stats`,

  // Users (admin)
  users: () => `users:list`,

  // Coupons
  coupon: (code: string) => `coupons:${code}`,
  coupons: () => `coupons:list`,

  // Reviews
  reviews: () => `reviews:list`,
} as const;

/** Invalidation group patterns — wildcard-based */
export const InvalidationPattern = {
  products: () => `products:*`,
  categories: () => `categories:*`,
  brands: () => `brands:*`,
  bikes: () => `bikes:*`,
  orders: () => `orders:*`,
  banners: () => `banners:*`,
  menu: () => `menu:*`,
  dashboard: () => `dashboard:*`,
  users: () => `users:*`,
  coupons: () => `coupons:*`,
  reviews: () => `reviews:*`,
};

/**
 * Cache-aside helper.
 * Tries Redis first; on miss, calls `fetcher`, caches the result, returns it.
 */
export async function withCache<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await redisGet(key);
  if (cached) {
    try {
      return JSON.parse(cached) as T;
    } catch {
      // Corrupted cache entry — fall through to fresh fetch
    }
  }

  const fresh = await fetcher();
  await redisSet(key, JSON.stringify(fresh), ttl);
  return fresh;
}

/**
 * Invalidate specific keys.
 */
export async function invalidateKeys(...keys: string[]): Promise<void> {
  await redisDel(...keys);
}

/**
 * Invalidate all keys matching a pattern.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  await redisDeletePattern(pattern);
}
