'use client';

import { useEffect, useCallback, memo } from 'react';
import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

// Global gtag declaration for Google Analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

// Custom metric interface for internal use with specific metric names
interface CustomMetric {
  name: string | 'LONG_TASK' | 'SLOW_RESOURCE' | 'DOM_CONTENT_LOADED';
  value: number;
  id: string;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

// Helper function to determine rating based on thresholds
const getRating = (metricName: string, value: number, thresholds?: Record<string, number>): 'good' | 'needs-improvement' | 'poor' => {
  if (!thresholds || !thresholds[metricName]) return 'good';
  
  const threshold = thresholds[metricName];
  if (value <= threshold) return 'good';
  if (value <= threshold * 1.5) return 'needs-improvement';
  return 'poor';
};

interface PerformanceConfig {
  enableAnalytics?: boolean;
  enableLogging?: boolean;
  analyticsEndpoint?: string;
  gaTrackingId?: string;
  thresholds?: {
    CLS: number;
    FCP: number;
    INP: number;
    LCP: number;
    TTFB: number;
  };
}

interface OptimizedPerformanceMonitorProps {
  config?: PerformanceConfig;
}

const defaultConfig: PerformanceConfig = {
  enableAnalytics: process.env.NODE_ENV === 'production',
  enableLogging: process.env.NODE_ENV === 'development',
  analyticsEndpoint: '/api/analytics/performance',
  gaTrackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
  thresholds: {
    CLS: 0.1,
    FCP: 1800,
    INP: 200,
    LCP: 2500,
    TTFB: 800,
  },
};

/**
 * OptimizedPerformanceMonitor - Consolidated performance monitoring component
 * 
 * Features:
 * - Core Web Vitals monitoring (CLS, FCP, INP, LCP, TTFB)
 * - Additional performance metrics via PerformanceObserver
 * - Configurable analytics and logging
 * - Memory-efficient with cleanup
 * - Memoized for optimal re-rendering
 */
const OptimizedPerformanceMonitor: React.FC<OptimizedPerformanceMonitorProps> = memo(({ 
  config = {} 
}) => {
  const finalConfig = { ...defaultConfig, ...config };

  // Memoized function to send data to analytics
  const sendToAnalytics = useCallback(async (metric: Metric | CustomMetric, additionalData?: any) => {
    if (!finalConfig.enableAnalytics) return;

    const data = {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      delta: metric.delta,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...additionalData,
    };

    try {
      // Send to Google Analytics if available
      if (finalConfig.gaTrackingId && window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }

      // Send to custom analytics endpoint
      if (finalConfig.analyticsEndpoint) {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            finalConfig.analyticsEndpoint,
            JSON.stringify(data)
          );
        } else {
          fetch(finalConfig.analyticsEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            keepalive: true,
          }).catch(() => {
            // Silently fail for analytics
          });
        }
      }
    } catch (error) {
      // Silently fail for analytics
    }
  }, [finalConfig]);

  // Memoized logging function with color coding
  const logMetric = useCallback((metric: Metric | CustomMetric, additionalInfo?: string) => {
    if (!finalConfig.enableLogging) return;

    const threshold = finalConfig.thresholds?.[metric.name as keyof typeof finalConfig.thresholds];
    const isGood = threshold ? metric.value <= threshold : true;
    const color = isGood ? '#10B981' : '#EF4444'; // Green for good, red for poor
    
    console.log(
      `%c📊 ${metric.name}: ${metric.value.toFixed(2)}${metric.name === 'CLS' ? '' : 'ms'} ${additionalInfo || ''}`,
      `color: ${color}; font-weight: bold;`
    );
  }, [finalConfig]);

  // Memoized metric handler
  const handleMetric = useCallback((metric: Metric) => {
    logMetric(metric);
    sendToAnalytics(metric);
  }, [logMetric, sendToAnalytics]);

  useEffect(() => {
    // Core Web Vitals monitoring
    onCLS(handleMetric);
    onFCP(handleMetric);
    onINP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);

    // Additional performance monitoring with PerformanceObserver
    const observers: PerformanceObserver[] = [];

    try {
      // Monitor navigation timing
      if ('PerformanceObserver' in window) {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              const metrics = {
                domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
                domComplete: navEntry.domComplete - navEntry.fetchStart,
                loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              };
              
              const customMetric: CustomMetric = { 
                name: 'DOM_CONTENT_LOADED', 
                value: metrics.domContentLoaded,
                id: 'nav-' + Date.now(),
                delta: 0,
                rating: getRating('DOM_CONTENT_LOADED', metrics.domContentLoaded, finalConfig.thresholds)
              };
              
              logMetric(customMetric, 'Navigation');
              
              sendToAnalytics(customMetric, { type: 'navigation', metrics });
            }
          });
        });

        navObserver.observe({ entryTypes: ['navigation'] });
        observers.push(navObserver);

        // Monitor long tasks (> 50ms)
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.duration > 50) {
              const longTaskMetric: CustomMetric = { 
                name: 'LONG_TASK', 
                value: entry.duration,
                id: 'task-' + Date.now(),
                delta: 0,
                rating: getRating('LONG_TASK', entry.duration, { LONG_TASK: 50 })
              };
              
              logMetric(longTaskMetric, `Duration: ${entry.duration.toFixed(2)}ms`);
              
              sendToAnalytics(longTaskMetric, { type: 'longtask', startTime: entry.startTime });
            }
          });
        });

        longTaskObserver.observe({ entryTypes: ['longtask'] });
        observers.push(longTaskObserver);

        // Monitor resource loading performance
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.duration > 1000) { // Resources taking > 1s
              const slowResourceMetric: CustomMetric = { 
                name: 'SLOW_RESOURCE', 
                value: resourceEntry.duration,
                id: 'resource-' + Date.now(),
                delta: 0,
                rating: getRating('SLOW_RESOURCE', resourceEntry.duration, { SLOW_RESOURCE: 1000 })
              };
              
              logMetric(slowResourceMetric, `Resource: ${resourceEntry.name.split('/').pop()}`);
              
              sendToAnalytics(slowResourceMetric, { 
                type: 'resource', 
                name: resourceEntry.name,
                transferSize: resourceEntry.transferSize 
              });
            }
          });
        });

        resourceObserver.observe({ entryTypes: ['resource'] });
        observers.push(resourceObserver);
      }
    } catch (error) {
      // PerformanceObserver not supported or failed
      console.warn('PerformanceObserver not fully supported:', error);
    }

    // Cleanup function
    return () => {
      observers.forEach(observer => {
        try {
          observer.disconnect();
        } catch (error) {
          // Ignore cleanup errors
        }
      });
    };
  }, [handleMetric, logMetric, sendToAnalytics]);

  // This component doesn't render anything
  return null;
});

OptimizedPerformanceMonitor.displayName = 'OptimizedPerformanceMonitor';

export default OptimizedPerformanceMonitor;