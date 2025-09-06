
import { useState, useEffect, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry<any>>();

export const useQueryCache = <T,>() => {
  const getCachedData = useCallback((key: string): T | null => {
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expiresAt) {
      console.log(`Cache HIT for key: ${key}`);
      return entry.data;
    }
    if (entry) {
      cache.delete(key);
      console.log(`Cache EXPIRED for key: ${key}`);
    }
    return null;
  }, []);

  const setCachedData = useCallback((key: string, data: T, ttl: number = CACHE_TTL) => {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };
    cache.set(key, entry);
    console.log(`Cache SET for key: ${key}, expires in ${ttl}ms`);
  }, []);

  const invalidateCache = useCallback((pattern?: string) => {
    if (pattern) {
      // Remove entries matching pattern
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key);
          console.log(`Cache INVALIDATED for key: ${key}`);
        }
      }
    } else {
      // Clear entire cache
      cache.clear();
      console.log('Cache CLEARED completely');
    }
  }, []);

  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(cache.entries());
    const active = entries.filter(([_, entry]) => now < entry.expiresAt).length;
    const expired = entries.length - active;
    
    return {
      total: entries.length,
      active,
      expired,
      size: cache.size
    };
  }, []);

  return {
    getCachedData,
    setCachedData,
    invalidateCache,
    getCacheStats
  };
};
