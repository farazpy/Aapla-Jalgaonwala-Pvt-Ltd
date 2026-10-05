import { Request, Response, NextFunction } from 'express';

export interface CacheEntry {
  data: any;
  category: string;
  expiresAt: number;
  sizeBytes: number;
  createdAt: number;
}

export interface CacheStats {
  isDevMode: boolean;
  cacheVersion: number;
  totalKeys: number;
  hits: number;
  misses: number;
  bypasses: number;
  hitRatioPercent: number;
  estimatedMemoryBytes: number;
  categoryCounts: Record<string, number>;
  ttlsSeconds: Record<string, number>;
}

class SystemCacheManager {
  private cache = new Map<string, CacheEntry>();
  private isDevMode = false;
  private cacheVersion = Date.now();
  private hits = 0;
  private misses = 0;
  private bypasses = 0;

  // Configurable default TTLs in seconds
  private categoryTtls: Record<string, number> = {
    products: 15,       // 15 seconds fast in-memory cache, instantly flushed on any admin update
    categories: 60,     // 1 min
    coupons: 60,        // 1 min
    settings: 60,       // 1 min
    seo: 300,           // 5 mins
    images: 604800,     // 7 days
    general: 60         // 1 min
  };

  /**
   * Get cached data if valid and not in dev mode
   */
  get(key: string): any | null {
    if (this.isDevMode) {
      this.bypasses++;
      return null;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data;
  }

  /**
   * Store data in cache
   */
  set(key: string, data: any, category = 'general', customTtlSeconds?: number): void {
    if (this.isDevMode) return;

    const ttl = customTtlSeconds ?? (this.categoryTtls[category] || this.categoryTtls.general);
    const expiresAt = Date.now() + ttl * 1000;
    
    // Estimate memory size roughly
    let sizeBytes = 250;
    try {
      sizeBytes = JSON.stringify(data).length;
    } catch (_) {}

    this.cache.set(key, {
      data,
      category,
      expiresAt,
      sizeBytes,
      createdAt: Date.now()
    });
  }

  /**
   * Flush entire cache or specific category
   */
  flush(category?: string): { clearedCount: number; newCacheVersion: number } {
    let clearedCount = 0;
    if (!category || category === 'all') {
      clearedCount = this.cache.size;
      this.cache.clear();
    } else {
      for (const [key, entry] of this.cache.entries()) {
        if (entry.category === category) {
          this.cache.delete(key);
          clearedCount++;
        }
      }
    }

    this.cacheVersion = Date.now();
    return { clearedCount, newCacheVersion: this.cacheVersion };
  }

  /**
   * Toggle or set Development Mode
   */
  setDevMode(enabled: boolean): boolean {
    this.isDevMode = enabled;
    if (enabled) {
      this.cache.clear();
    }
    this.cacheVersion = Date.now();
    return this.isDevMode;
  }

  getDevMode(): boolean {
    return this.isDevMode;
  }

  getCacheVersion(): number {
    return this.cacheVersion;
  }

  /**
   * Update TTL configuration
   */
  updateTtls(newTtls: Partial<Record<string, number>>): Record<string, number> {
    this.categoryTtls = {
      ...this.categoryTtls,
      ...newTtls
    };
    return this.categoryTtls;
  }

  /**
   * Get live stats
   */
  getStats(): CacheStats {
    // Purge expired entries first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    const categoryCounts: Record<string, number> = {};
    let estimatedMemoryBytes = 0;

    for (const entry of this.cache.values()) {
      categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
      estimatedMemoryBytes += entry.sizeBytes;
    }

    const totalReqs = this.hits + this.misses;
    const hitRatioPercent = totalReqs > 0 ? Math.round((this.hits / totalReqs) * 100) : 0;

    return {
      isDevMode: this.isDevMode,
      cacheVersion: this.cacheVersion,
      totalKeys: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      bypasses: this.bypasses,
      hitRatioPercent,
      estimatedMemoryBytes,
      categoryCounts,
      ttlsSeconds: { ...this.categoryTtls }
    };
  }

  /**
   * Get detailed list of active keys
   */
  getActiveKeys(): Array<{ key: string; category: string; ttlRemainingSec: number; sizeKb: number }> {
    const now = Date.now();
    const result: Array<{ key: string; category: string; ttlRemainingSec: number; sizeKb: number }> = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now <= entry.expiresAt) {
        result.push({
          key,
          category: entry.category,
          ttlRemainingSec: Math.max(0, Math.round((entry.expiresAt - now) / 1000)),
          sizeKb: Number((entry.sizeBytes / 1024).toFixed(2))
        });
      }
    }

    return result.sort((a, b) => b.ttlRemainingSec - a.ttlRemainingSec);
  }

  /**
   * Express Middleware for Caching GET Endpoints and Setting Strong Headers
   */
  middleware(category = 'general', customTtlSeconds?: number) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      // Always send Cache-Version header for client cache validation
      res.setHeader('X-Cache-Version', String(this.cacheVersion));

      const isAdminRequest =
        req.originalUrl?.includes('/admin') ||
        req.url?.includes('/admin') ||
        req.headers['x-admin-request'] === 'true' ||
        req.headers['cache-control']?.includes('no-cache') ||
        req.headers['pragma'] === 'no-cache' ||
        (req.headers.referer && req.headers.referer.includes('/admin'));

      if (this.isDevMode || isAdminRequest) {
        res.setHeader('X-Cache-Status', isAdminRequest ? 'BYPASS-ADMIN' : 'BYPASS-DEV-MODE');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return next();
      }

      const cacheKey = `${category}:${req.originalUrl || req.url}`;
      const cached = this.get(cacheKey);

      if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        if (category === 'products') {
          res.setHeader('Cache-Control', 'no-cache, must-revalidate');
        } else {
          const ttl = customTtlSeconds ?? (this.categoryTtls[category] || 60);
          res.setHeader('Cache-Control', `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=60`);
        }
        return res.json(cached);
      }

      res.setHeader('X-Cache-Status', 'MISS');
      if (category === 'products') {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      } else {
        const ttl = customTtlSeconds ?? (this.categoryTtls[category] || 60);
        res.setHeader('Cache-Control', `public, max-age=${ttl}, s-maxage=${ttl}, stale-while-revalidate=60`);
      }

      // Intercept res.json to capture response payload
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          this.set(cacheKey, body, category, customTtlSeconds);
        }
        return originalJson(body);
      };

      next();
    };
  }
}

export const systemCache = new SystemCacheManager();
