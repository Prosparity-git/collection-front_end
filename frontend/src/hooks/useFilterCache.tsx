
import { useState, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useFilterCache = <T,>(key: string) => {
  const [cache, setCache] = useState<Map<string, CacheEntry<T>>>(new Map());

  const getCachedData = (cacheKey: string): T | null => {
    const entry = cache.get(cacheKey);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data;
    }
    return null;
  };

  const setCachedData = (cacheKey: string, data: T) => {
    setCache(prev => new Map(prev.set(cacheKey, {
      data,
      timestamp: Date.now()
    })));
  };

  const clearCache = () => {
    setCache(new Map());
  };

  // Clean up expired entries periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      setCache(prev => {
        const newCache = new Map();
        prev.forEach((entry, key) => {
          if (Date.now() - entry.timestamp < CACHE_TTL) {
            newCache.set(key, entry);
          }
        });
        return newCache;
      });
    }, CACHE_TTL);

    return () => clearInterval(cleanup);
  }, []);

  return { getCachedData, setCachedData, clearCache };
};
