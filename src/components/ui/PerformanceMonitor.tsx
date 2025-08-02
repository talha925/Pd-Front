'use client';

import { useEffect } from 'react';

interface PerformanceMetrics {
  FCP: number | null; // First Contentful Paint
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift
  TTFB: number | null; // Time to First Byte
}

/**
 * PerformanceMonitor - A component to track and report Web Vitals metrics
 * This helps monitor real user performance and identify areas for improvement
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production to avoid development noise
    if (process.env.NODE_ENV !== 'production') return;
    
    const metrics: PerformanceMetrics = {
      FCP: null,
      LCP: null,
      FID: null,
      CLS: null,
      TTFB: null,
    };
    
    // Track First Contentful Paint (FCP)
    const trackFCP = () => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        metrics.FCP = fcpEntry.startTime;
        reportMetrics('FCP', metrics.FCP);
      }
    };
    
    // Track Time to First Byte (TTFB)
    const trackTTFB = () => {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const navEntry = navigationEntries[0] as PerformanceNavigationTiming;
        metrics.TTFB = navEntry.responseStart;
        reportMetrics('TTFB', metrics.TTFB);
      }
    };
    
    // Track Largest Contentful Paint (LCP)
    const trackLCP = () => {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.LCP = lastEntry.startTime;
        reportMetrics('LCP', metrics.LCP);
      });
      
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    };
    
    // Track First Input Delay (FID)
    const trackFID = () => {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const firstInput = entries[0];
        metrics.FID = (firstInput as any).processingStart - firstInput.startTime;
        reportMetrics('FID', metrics.FID);
      });
      
      fidObserver.observe({ type: 'first-input', buffered: true });
    };
    
    // Track Cumulative Layout Shift (CLS)
    const trackCLS = () => {
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];
      
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach(entry => {
          // Only count layout shifts without recent user input
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            clsEntries.push(entry);
          }
        });
        
        metrics.CLS = clsValue;
        reportMetrics('CLS', metrics.CLS);
      });
      
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    };
    
    // Report metrics to analytics or logging service
    const reportMetrics = (metricName: string, value: number | null) => {
      if (value === null) return;
      
      // You can replace this with your actual analytics service
      console.log(`[Performance] ${metricName}: ${value}`);
      
      // Example: Send to Google Analytics
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: metricName,
          value: Math.round(value),
          non_interaction: true,
        });
      }
    };
    
    // Initialize tracking
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Use requestIdleCallback or setTimeout to not block main thread
      const scheduleTask = window.requestIdleCallback || window.setTimeout;
      
      scheduleTask(() => {
        trackFCP();
        trackTTFB();
        trackLCP();
        trackFID();
        trackCLS();
      });
    }
    
    // Report all metrics when the page is being unloaded
    const reportAllMetrics = () => {
      Object.entries(metrics).forEach(([key, value]) => {
        if (value !== null) {
          reportMetrics(key, value);
        }
      });
    };
    
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        reportAllMetrics();
      }
    });
    
    window.addEventListener('beforeunload', reportAllMetrics);
    
    return () => {
      window.removeEventListener('visibilitychange', reportAllMetrics);
      window.removeEventListener('beforeunload', reportAllMetrics);
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
}

// Add TypeScript declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    // We don't need to redeclare requestIdleCallback as it's already defined in lib.dom.d.ts
  }
}