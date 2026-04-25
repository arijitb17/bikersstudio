// lib/rateLimiter.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis } from './redis';

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window duration in seconds */
  window: number;
  /** Key prefix for namespacing */
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (seconds)
  retryAfter?: number; // Seconds to wait
}

/**
 * Sliding window rate limiter using Redis sorted sets.
 * Falls back to allowing the request if Redis is unavailable (fail-open).
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { limit, window: windowSecs, prefix = 'rl' } = config;
  const key = `${prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = windowSecs * 1000;
  const windowStart = now - windowMs;

  try {
    const pipeline = redis.pipeline();

    // Remove expired entries
    pipeline.zremrangebyscore(key, '-inf', windowStart);
    // Add current request with timestamp as score
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    // Count requests in window
    pipeline.zcard(key);
    // Set TTL to clean up stale keys
    pipeline.expire(key, windowSecs + 1);

    const results = await pipeline.exec();

    // zcard result is at index 2
    const count = (results?.[2]?.[1] as number) ?? 0;
    const remaining = Math.max(0, limit - count);
    const reset = Math.ceil((now + windowMs) / 1000);

    if (count > limit) {
      // Find the oldest entry to compute retry-after
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const oldestTs = oldest[1] ? parseInt(oldest[1]) : now;
      const retryAfter = Math.ceil((oldestTs + windowMs - now) / 1000);

      return { success: false, limit, remaining: 0, reset, retryAfter };
    }

    return { success: true, limit, remaining, reset };
  } catch {
    // Redis unavailable — fail open to avoid blocking users
    console.warn('[RateLimit] Redis unavailable, failing open');
    return {
      success: true,
      limit,
      remaining: limit,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }
}

/**
 * Build rate limit response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  };
  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  return headers;
}

/**
 * Extract a stable identifier from a request.
 * Uses authenticated user ID if available, otherwise IP.
 */
export function getIdentifier(req: NextRequest, userId?: string): string {
  if (userId) return `user:${userId}`;
  
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
    req.headers.get('x-real-ip') ?? 
    '127.0.0.1';
  return `ip:${ip}`;
}

// ─── Pre-configured limiters ─────────────────────────────────────────────────

/** General API: 100 req / min per IP */
export const API_LIMITER: RateLimitConfig = {
  limit: 100,
  window: 60,
  prefix: 'rl:api',
};

/** Auth endpoints: 10 req / min per IP (brute-force protection) */
export const AUTH_LIMITER: RateLimitConfig = {
  limit: 10,
  window: 60,
  prefix: 'rl:auth',
};

/** Admin write operations: 60 req / min per user */
export const ADMIN_WRITE_LIMITER: RateLimitConfig = {
  limit: 60,
  window: 60,
  prefix: 'rl:admin',
};

/** Upload endpoints: 20 req / min per user */
export const UPLOAD_LIMITER: RateLimitConfig = {
  limit: 20,
  window: 60,
  prefix: 'rl:upload',
};

/** Order creation: 5 per minute per user */
export const ORDER_LIMITER: RateLimitConfig = {
  limit: 5,
  window: 60,
  prefix: 'rl:order',
};

/** Coupon validation: 20 per minute per user */
export const COUPON_LIMITER: RateLimitConfig = {
  limit: 20,
  window: 60,
  prefix: 'rl:coupon',
};

/**
 * Convenience: apply rate limit and return a 429 response if exceeded.
 * Returns null if the request should proceed.
 */
export async function applyRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  userId?: string
): Promise<NextResponse | null> {
  const id = getIdentifier(req, userId);
  const result = await checkRateLimit(id, config);
  const headers = rateLimitHeaders(result);

  if (!result.success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: result.retryAfter,
      },
      { status: 429, headers }
    );
  }

  return null; // proceed
}
