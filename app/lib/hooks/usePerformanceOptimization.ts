import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOptimizedConfig, PerformanceMonitor, createThrottle, createBatcher } from '~/utils/performance-config';

/**
 * Hook for performance-optimized state updates
 */
export function useThrottledState<T>(
  initialValue: T,
  throttleDelay?: number
): [T, (value: T) => void] {
  const [state, setState] = useState(initialValue);
  const config = getOptimizedConfig();
  const delay = throttleDelay || config.DEBOUNCE.INPUT_DELAY;
  
  const throttledSetState = useMemo(
    () => createThrottle(setState, delay),
    [delay]
  );
  
  return [state, throttledSetState];
}

/**
 * Hook for batched updates to prevent excessive re-renders
 */
export function useBatchedUpdates<T>(
  processor: (items: T[]) => void,
  batchDelay?: number,
  maxBatchSize?: number
) {
  const config = getOptimizedConfig();
  const delay = batchDelay || 100;
  const maxSize = maxBatchSize || config.ACTION_EXECUTION.BATCH_SIZE;
  
  const batcher = useMemo(
    () => createBatcher(processor, delay, maxSize),
    [processor, delay, maxSize]
  );
  
  return batcher;
}

/**
 * Hook for performance monitoring
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const mountTimeRef = useRef(performance.now());
  
  useEffect(() => {
    renderCountRef.current += 1;
    
    const endTiming = PerformanceMonitor.startTiming(`${componentName}-render`);
    
    return () => {
      endTiming();
      
      // Log excessive re-renders
      if (renderCountRef.current > 10) {
        console.warn(`${componentName} has rendered ${renderCountRef.current} times`);
      }
    };
  });
  
  useEffect(() => {
    const mountDuration = performance.now() - mountTimeRef.current;
    PerformanceMonitor.recordMetric(`${componentName}-mount`, mountDuration);
    
    return () => {
      const unmountTime = performance.now() - mountTimeRef.current;
      PerformanceMonitor.recordMetric(`${componentName}-lifetime`, unmountTime);
    };
  }, [componentName]);
  
  return {
    renderCount: renderCountRef.current,
    getMetrics: () => PerformanceMonitor.getMetrics(),
  };
}

/**
 * Hook for optimized file operations
 */
export function useOptimizedFileOperations() {
  const config = getOptimizedConfig();
  const pendingOperations = useRef(new Map<string, NodeJS.Timeout>());
  
  const debouncedSave = useCallback(
    (filePath: string, content: string, saveFunction: (path: string, content: string) => Promise<void>) => {
      // Clear existing timeout for this file
      const existingTimeout = pendingOperations.current.get(filePath);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // Set new timeout
      const timeout = setTimeout(async () => {
        const endTiming = PerformanceMonitor.startTiming('file-save');
        try {
          await saveFunction(filePath, content);
        } finally {
          endTiming();
          pendingOperations.current.delete(filePath);
        }
      }, config.FILE_OPERATIONS.SAVE_DEBOUNCE);
      
      pendingOperations.current.set(filePath, timeout);
    },
    [config.FILE_OPERATIONS.SAVE_DEBOUNCE]
  );
  
  const flushPendingOperations = useCallback(async () => {
    const promises: Promise<void>[] = [];
    
    for (const [filePath, timeout] of pendingOperations.current.entries()) {
      clearTimeout(timeout);
      // Force immediate execution would require storing the operation details
      // For now, just clear the timeouts
    }
    
    pendingOperations.current.clear();
    await Promise.all(promises);
  }, []);
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      for (const timeout of pendingOperations.current.values()) {
        clearTimeout(timeout);
      }
      pendingOperations.current.clear();
    };
  }, []);
  
  return {
    debouncedSave,
    flushPendingOperations,
  };
}

/**
 * Hook for virtual scrolling optimization
 */
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  const config = getOptimizedConfig();
  
  const visibleRange = useMemo(() => {
    const threshold = config.RENDERING.VIRTUAL_SCROLL_THRESHOLD;
    
    if (items.length <= threshold) {
      return { start: 0, end: items.length };
    }
    
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 5, items.length); // +5 for buffer
    
    return { start: Math.max(0, start - 5), end }; // -5 for buffer
  }, [items.length, itemHeight, containerHeight, scrollTop, config.RENDERING.VIRTUAL_SCROLL_THRESHOLD]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
    }));
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;
  
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
}

/**
 * Hook for memory usage optimization
 */
export function useMemoryOptimization() {
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryUsage(memory.usedJSHeapSize / memory.jsHeapSizeLimit);
      }
    };
    
    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const isMemoryConstrained = memoryUsage !== null && memoryUsage > 0.8; // 80% threshold
  
  return {
    memoryUsage,
    isMemoryConstrained,
    forceGarbageCollection: () => {
      if ('gc' in window) {
        (window as any).gc();
      }
    },
  };
}

/**
 * Hook for adaptive performance based on device capabilities
 */
export function useAdaptivePerformance() {
  const [performanceLevel, setPerformanceLevel] = useState<'high' | 'medium' | 'low'>('medium');
  
  useEffect(() => {
    const assessPerformance = () => {
      const connection = (navigator as any).connection;
      const memory = (navigator as any).deviceMemory;
      const cores = navigator.hardwareConcurrency;
      
      let score = 0;
      
      // Network assessment
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g') score += 3;
        else if (effectiveType === '3g') score += 2;
        else if (effectiveType === '2g') score += 1;
      } else {
        score += 2; // Assume decent connection if unknown
      }
      
      // Memory assessment
      if (memory) {
        if (memory >= 8) score += 3;
        else if (memory >= 4) score += 2;
        else score += 1;
      } else {
        score += 2; // Assume decent memory if unknown
      }
      
      // CPU assessment
      if (cores) {
        if (cores >= 8) score += 3;
        else if (cores >= 4) score += 2;
        else score += 1;
      } else {
        score += 2; // Assume decent CPU if unknown
      }
      
      // Determine performance level
      if (score >= 8) setPerformanceLevel('high');
      else if (score >= 5) setPerformanceLevel('medium');
      else setPerformanceLevel('low');
    };
    
    assessPerformance();
  }, []);
  
  return {
    performanceLevel,
    shouldUseVirtualScrolling: performanceLevel === 'low',
    shouldReduceAnimations: performanceLevel === 'low',
    shouldLimitConcurrency: performanceLevel !== 'high',
  };
}