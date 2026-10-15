import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  body: any;
  contentType: string;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry>();
const MAX_CACHE_ENTRIES = 500;

/**
 * Invalidate in-memory cache entries.
 * If prefix is provided, only deletes keys starting with that prefix.
 * Otherwise clears all cache.
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryStore.clear();
    return;
  }
  for (const key of memoryStore.keys()) {
    if (key.includes(prefix)) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Middleware to invalidate cache on successful mutation (POST/PUT/PATCH/DELETE)
 */
export function purgeCacheOnSuccess(prefix: string) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache(prefix);
      }
    });
    next();
  };
}

/**
 * High-performance In-Memory Response Cache & HTTP Edge Cache-Control middleware.
 * Only applies to public unauthenticated GET requests.
 *
 * @param ttlSeconds In-memory cache duration in seconds (default: 30)
 * @param edgeTtlSeconds Cloudflare / CDN edge cache duration in seconds (default: equals ttlSeconds)
 */
export function publicCache(ttlSeconds = 30, edgeTtlSeconds = ttlSeconds) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Bypass cache for authenticated users to ensure personal permissions & freshness
    const hasAuth = !!(req.headers.authorization || req.cookies?.refreshToken || req.cookies?.accessToken);
    if (hasAuth) {
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      return next();
    }

    // Set Cloudflare Edge & Browser cache headers
    res.setHeader(
      'Cache-Control',
      `public, max-age=${ttlSeconds}, s-maxage=${edgeTtlSeconds}, stale-while-revalidate=${ttlSeconds * 2}`
    );

    // Build unique cache key from base path and query parameters
    const cacheKey = `${req.baseUrl || ''}${req.path}?${JSON.stringify(req.query || {})}`;
    const cached = memoryStore.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      res.setHeader('X-Cache', 'HIT');
      if (cached.contentType) {
        res.setHeader('Content-Type', cached.contentType);
      }
      res.send(cached.body);
      return;
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.send to capture response body
    const originalSend = res.send.bind(res);
    res.send = (body: any): Response => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Enforce max entry limit to prevent unbounded memory growth
        if (memoryStore.size >= MAX_CACHE_ENTRIES) {
          const firstKey = memoryStore.keys().next().value;
          if (firstKey) {
            memoryStore.delete(firstKey);
          }
        }

        memoryStore.set(cacheKey, {
          body,
          contentType: (res.getHeader('Content-Type') as string) || 'application/json; charset=utf-8',
          expiresAt: now + ttlSeconds * 1000,
        });
      }
      return originalSend(body);
    };

    next();
  };
}
