import { useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  threshold?: number;
}

/**
 * Custom hook for infinite scroll functionality
 * Optimized for performance with Intersection Observer
 */
export function useInfiniteScroll({
  loading,
  hasMore,
  onLoadMore,
  threshold = 0.5
}: UseInfiniteScrollOptions) {
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && !loading && hasMore) {
        onLoadMore();
      }
    },
    [loading, hasMore, onLoadMore]
  );

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    observer.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold
    });

    observer.current.observe(element);

    return () => {
      if (observer.current && element) {
        observer.current.unobserve(element);
      }
    };
  }, [handleObserver, threshold]);

  return sentinelRef;
}
