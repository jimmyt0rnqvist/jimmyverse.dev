/**
 * Performance configuration for Bolt.DIY
 * Adjusts various intervals and thresholds to prevent UI freezing
 */

export const PERFORMANCE_CONFIG = {
  // File watching and polling intervals
  FILE_WATCHER: {
    POLLING_INTERVAL: 5000, // Increased from 3000ms to reduce CPU usage
    FALLBACK_ENABLED: false, // Start with native watching, fallback if needed
  },

  // Action execution and streaming
  ACTION_EXECUTION: {
    STREAM_SAMPLER_DELAY: 200, // Increased from 100ms to reduce rapid updates
    BATCH_SIZE: 5, // Process max 5 actions at once
    THROTTLE_DELAY: 300, // Throttle rapid action execution
  },

  // UI update intervals
  UI_UPDATES: {
    LOCK_MANAGER_INTERVAL: 10000, // Increased from 5000ms
    TASK_MANAGER_INTERVAL: 8000, // Increased from 5000ms
    DEBUG_TAB_INTERVAL: 15000, // Increased from 10000ms
    SERVICE_STATUS_INTERVAL: 300000, // 5 minutes instead of 2 minutes
  },

  // Debounce and throttle settings
  DEBOUNCE: {
    SEARCH_DELAY: 500, // Increased from 300ms
    INPUT_DELAY: 300,
    RESIZE_DELAY: 250,
  },

  // Memory and rendering optimizations
  RENDERING: {
    MAX_VISIBLE_LOGS: 1000, // Limit visible log entries
    VIRTUAL_SCROLL_THRESHOLD: 100, // Use virtual scrolling for large lists
    MEMO_CACHE_SIZE: 50, // Limit React.memo cache size
  },

  // File operations
  FILE_OPERATIONS: {
    MAX_CONCURRENT_READS: 3, // Limit concurrent file reads
    CHUNK_SIZE: 1024 * 64, // 64KB chunks for large files
    SAVE_DEBOUNCE: 1000, // Debounce file saves
  },

  // Network and API calls
  NETWORK: {
    REQUEST_TIMEOUT: 10000, // 10 second timeout
    MAX_RETRIES: 2,
    RETRY_DELAY: 1000,
    RATE_LIMIT_DELAY: 100, // Delay between rapid API calls
  },
};

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  private static readonly MAX_SAMPLES = 100;

  static startTiming(label: string): () => number {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
      return duration;
    };
  }

  static recordMetric(label: string, value: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    
    const samples = this.metrics.get(label)!;
    samples.push(value);
    
    // Keep only recent samples
    if (samples.length > this.MAX_SAMPLES) {
      samples.shift();
    }
  }

  static getAverageMetric(label: string): number {
    const samples = this.metrics.get(label) || [];
    if (samples.length === 0) return 0;
    return samples.reduce((sum, val) => sum + val, 0) / samples.length;
  }

  static getMetrics(): Record<string, { avg: number; count: number }> {
    const result: Record<string, { avg: number; count: number }> = {};
    
    for (const [label, samples] of this.metrics.entries()) {
      result[label] = {
        avg: this.getAverageMetric(label),
        count: samples.length,
      };
    }
    
    return result;
  }

  static clearMetrics() {
    this.metrics.clear();
  }
}

/**
 * Throttle function calls to prevent excessive execution
 */
export function createThrottle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - (now - lastCall));
    }
  }) as T;
}

/**
 * Batch function calls to reduce execution frequency
 */
export function createBatcher<T>(
  processor: (items: T[]) => void,
  delay: number = 100,
  maxBatchSize: number = 10
) {
  let batch: T[] = [];
  let timeoutId: NodeJS.Timeout | null = null;

  const flush = () => {
    if (batch.length > 0) {
      processor([...batch]);
      batch = [];
    }
    timeoutId = null;
  };

  return (item: T) => {
    batch.push(item);
    
    if (batch.length >= maxBatchSize) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      flush();
    } else if (!timeoutId) {
      timeoutId = setTimeout(flush, delay);
    }
  };
}

/**
 * Check if the current environment is resource-constrained
 */
export function isResourceConstrained(): boolean {
  if (typeof navigator === 'undefined') return false;
  
  // Check for low-end devices
  const connection = (navigator as any).connection;
  if (connection && connection.effectiveType && 
      ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) {
    return true;
  }
  
  // Check for limited memory
  const memory = (navigator as any).deviceMemory;
  if (memory && memory < 4) { // Less than 4GB RAM
    return true;
  }
  
  // Check for limited CPU cores
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true;
  }
  
  return false;
}

/**
 * Adjust performance config based on device capabilities
 */
export function getOptimizedConfig() {
  const config = { ...PERFORMANCE_CONFIG };
  
  if (isResourceConstrained()) {
    // Increase intervals for low-end devices
    config.FILE_WATCHER.POLLING_INTERVAL *= 2;
    config.ACTION_EXECUTION.STREAM_SAMPLER_DELAY *= 1.5;
    config.UI_UPDATES.LOCK_MANAGER_INTERVAL *= 2;
    config.UI_UPDATES.TASK_MANAGER_INTERVAL *= 2;
    config.DEBOUNCE.SEARCH_DELAY *= 1.5;
    config.RENDERING.MAX_VISIBLE_LOGS = Math.floor(config.RENDERING.MAX_VISIBLE_LOGS / 2);
  }
  
  return config;
}