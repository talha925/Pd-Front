'use client';

import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

const PerformanceTracker = () => {
  usePerformanceMonitoring({
    enableLogging: process.env.NODE_ENV === 'development',
    enableAnalytics: process.env.NODE_ENV === 'production',
    thresholds: {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 }
    }
  });

  // This component doesn't render anything visible
  return null;
};

export default PerformanceTracker;