/**
 * Performance optimization utilities for handling 1M+ users
 */

// Debounce function for search and input handlers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll and resize handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Pagination helper
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export function paginate<T>(
  items: T[],
  params: PaginationParams
): { items: T[]; totalPages: number; hasMore: boolean } {
  const { page, pageSize } = params;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedItems = items.slice(start, end);
  const totalPages = Math.ceil(items.length / pageSize);
  const hasMore = page < totalPages;

  return {
    items: paginatedItems,
    totalPages,
    hasMore,
  };
}

// Image lazy loading with Intersection Observer
export function setupLazyLoading(
  imageSelector: string = 'img[data-lazy]'
): IntersectionObserver {
  const imageObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.lazy;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-lazy');
            observer.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01,
    }
  );

  document.querySelectorAll(imageSelector).forEach((img) => {
    imageObserver.observe(img);
  });

  return imageObserver;
}

// Simple in-memory cache with TTL
class SimpleCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map();

  set(key: string, value: any, ttlMs: number = 300000): void {
    // Default 5 minutes TTL
    const expiry = Date.now() + ttlMs;
    this.cache.set(key, { value, expiry });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();

// Request deduplication for preventing duplicate API calls
class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async deduplicate<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    const promise = fn().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear(key?: string) {
    if (key) {
      this.pending.delete(key);
    } else {
      this.pending.clear();
    }
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Batch updates for better performance
export function batchUpdates<T>(
  updates: T[],
  batchSize: number = 10
): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < updates.length; i += batchSize) {
    batches.push(updates.slice(i, i + batchSize));
  }
  return batches;
}

// Memoization helper for expensive computations
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator 
      ? keyGenerator(...args) 
      : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}
