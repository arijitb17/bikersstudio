// lib/redis.ts
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};
function createRedisClient(): Redis {
  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 3) return null; // Stop retrying after 3 attempts
      return Math.min(times * 200, 1000);
    },
    reconnectOnError(err) {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some(e => err.message.includes(e));
    },
  });

  client.on('error', (err) => {
    // Log but don't crash — Redis is optional for degraded mode
    console.error('[Redis] Connection error:', err.message);
  });

  client.on('connect', () => {
    console.log('[Redis] Connected');
  });

  return client;
}

export const redis: Redis =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

/** Safe get — returns null on Redis failure */
export async function redisGet(key: string): Promise<string | null> {
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

/** Safe set with TTL — silently fails on Redis failure */
export async function redisSet(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  try {
    await redis.set(key, value, 'EX', ttlSeconds);
  } catch {
    // Degraded mode: skip caching
  }
}

/** Safe delete — silently fails on Redis failure */
export async function redisDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Degraded mode: skip invalidation
  }
}

/** Scan and delete keys matching a pattern */
export async function redisDeletePattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) await redis.del(...keys);
    } while (cursor !== '0');
  } catch {
    // Degraded mode
  }
}
