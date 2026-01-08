/**
 * Offline-First Wrapper for Supabase Queries
 * Provides graceful degradation when network is unavailable
 */

import { useOnlineStatus } from '@/hooks/useOptimisticMutation';
import { offlineStorage } from './offlineStorage';

interface QueryOptions<T> {
  queryFn: () => Promise<T>;
  cacheKey: string;
  fallbackData?: T;
  silentFail?: boolean;
}

/**
 * Wraps a Supabase query with offline-first logic
 * - When online: executes query and caches result
 * - When offline: returns cached data or fallback
 * - Never throws errors to UI
 */
export async function offlineQuery<T>({
  queryFn,
  cacheKey,
  fallbackData,
  silentFail = true,
}: QueryOptions<T>): Promise<{ data: T | null; error: Error | null; fromCache: boolean }> {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // If offline, return cached data immediately
  if (!isOnline) {
    try {
      const cached = await offlineStorage.get(cacheKey);
      if (cached) {
        return { data: cached as T, error: null, fromCache: true };
      }
      // No cache, return fallback
      return { 
        data: fallbackData || null, 
        error: new Error('Offline - no cached data'), 
        fromCache: false 
      };
    } catch (err) {
      return { 
        data: fallbackData || null, 
        error: err instanceof Error ? err : new Error('Cache read failed'), 
        fromCache: false 
      };
    }
  }

  // Online - try query with timeout
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );

    const data = await Promise.race([queryFn(), timeoutPromise]);
    
    // Cache successful result
    try {
      await offlineStorage.set(cacheKey, data);
    } catch (cacheErr) {
      console.warn('Failed to cache data:', cacheErr);
    }

    return { data, error: null, fromCache: false };
  } catch (err) {
    // Query failed - try cache
    if (silentFail) {
      try {
        const cached = await offlineStorage.get(cacheKey);
        if (cached) {
          console.warn('Query failed, using cached data:', err);
          return { data: cached as T, error: null, fromCache: true };
        }
      } catch {
        // Cache also failed
      }

      // Return fallback without throwing
      return { 
        data: fallbackData || null, 
        error: err instanceof Error ? err : new Error('Query failed'), 
        fromCache: false 
      };
    }

    // Not silent - return error
    return { 
      data: null, 
      error: err instanceof Error ? err : new Error('Query failed'), 
      fromCache: false 
    };
  }
}

/**
 * Simple in-memory cache for offline storage operations
 */
const memoryCache = new Map<string, any>();

const offlineStorageShim = {
  get: async (key: string) => {
    return memoryCache.get(key);
  },
  set: async (key: string, value: any) => {
    memoryCache.set(key, value);
  },
  delete: async (key: string) => {
    memoryCache.delete(key);
  },
  clear: async () => {
    memoryCache.clear();
  },
};

// Export simple storage that works without SQLite
export const simpleStorage = offlineStorageShim;

/**
 * Higher-order function to wrap any hook with offline support
 */
export function withOfflineSupport<T extends (...args: any[]) => any>(
  hook: T,
  options: {
    fallbackData?: ReturnType<T>;
    errorMessage?: string;
  } = {}
): T {
  return ((...args: Parameters<T>) => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    
    if (!isOnline && options.fallbackData) {
      return options.fallbackData;
    }

    try {
      return hook(...args);
    } catch (err) {
      console.error(options.errorMessage || 'Hook error:', err);
      return options.fallbackData || null;
    }
  }) as T;
}
