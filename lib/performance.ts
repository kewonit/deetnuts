/**
 * Performance monitoring utilities
 * Best Practice: Track and optimize performance metrics
 */

/**
 * Measure component render time
 */
export function measureRenderTime(componentName: string) {
  const start = performance.now();

  return () => {
    const end = performance.now();
    const duration = end - start;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Performance] ${componentName} rendered in ${duration.toFixed(2)}ms`,
      );
    }

    // Send to analytics in production
    if (
      process.env.NODE_ENV === "production" &&
      typeof window !== "undefined"
    ) {
      // Example: window.analytics?.track('component_render', { component: componentName, duration })
    }
  };
}

/**
 * Report Web Vitals to analytics
 * Best Practice: Monitor Core Web Vitals
 */
export function reportWebVitals(metric: {
  name: string;
  value: number;
  id: string;
}) {
  if (process.env.NODE_ENV === "production") {
    const { name, value, id } = metric;

    // Send to analytics service (e.g., Vercel Analytics, Google Analytics)
    // window.gtag?.('event', name, { value, metric_id: id })

    // Note: Console logging removed for production. Enable analytics integration above.
    void { name, value, id }; // Prevent unused variable warnings
  }
}

/**
 * Log slow queries for optimization
 */
export async function trackQueryPerformance<T>(
  queryName: string,
  query: () => Promise<T>,
  threshold = 1000,
): Promise<T> {
  const start = performance.now();

  try {
    const result = await query();
    const duration = performance.now() - start;

    if (duration > threshold) {
      console.warn(`[Slow Query] ${queryName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(
      `[Query Error] ${queryName} failed after ${duration.toFixed(2)}ms`,
      error,
    );
    throw error;
  }
}
