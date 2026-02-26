import { useCallback, useRef, useEffect, DependencyList, useState } from 'react';

/**
 * Debounce a callback function
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

/**
 * Throttle a callback function
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  limit: number
): T {
  const inThrottle = useRef(false);
  const lastCallback = useRef<T>(callback);

  useEffect(() => {
    lastCallback.current = callback;
  }, [callback]);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (!inThrottle.current) {
        lastCallback.current(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    }) as T,
    [limit]
  );
}

/**
 * Hook that returns true after the component has mounted
 * Useful for SSR/hydration scenarios
 */
export function useHasMounted() {
  const hasMounted = useRef(false);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  return hasMounted.current;
}

/**
 * Hook to get previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Hook for intersection observer - useful for lazy loading
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setEntry(entry);
    }, options);

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options.threshold, options.root, options.rootMargin]);

  return entry;
}

/**
 * Hook for lazy loading components when they come into view
 */
export function useLazyLoad(elementRef: React.RefObject<Element>) {
  const [hasLoaded, setHasLoaded] = useState(false);
  
  const entry = useIntersectionObserver(elementRef, {
    threshold: 0.1,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (entry?.isIntersecting && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [entry?.isIntersecting, hasLoaded]);

  return hasLoaded;
}

/**
 * Memoize a value with deep equality check
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<{ deps: DependencyList; value: T } | undefined>(undefined);

  if (!ref.current || !depsAreEqual(ref.current.deps, deps)) {
    ref.current = { deps, value: factory() };
  }

  return ref.current.value;
}

function depsAreEqual(prevDeps: DependencyList, nextDeps: DependencyList): boolean {
  if (prevDeps.length !== nextDeps.length) return false;
  
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) {
      // Deep equality check for objects
      if (typeof prevDeps[i] === 'object' && typeof nextDeps[i] === 'object') {
        if (JSON.stringify(prevDeps[i]) !== JSON.stringify(nextDeps[i])) {
          return false;
        }
      } else {
        return false;
      }
    }
  }
  
  return true;
}
