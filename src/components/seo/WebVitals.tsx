'use client';

import { useEffect } from 'react';

/**
 * Reports Core Web Vitals (LCP, INP, CLS, FCP, TTFB) to the console
 * in development and can be extended to send to GA4 or a custom endpoint.
 *
 * Uses the `web-vitals` library directly since `useReportWebVitals`
 * was removed in Next.js 15+.
 */
export function WebVitals() {
  useEffect(() => {
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const report = (metric: { name: string; value: number; id: string }) => {
        // Log in dev for debugging
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)}`);
        }

        // Send to Google Analytics 4 (if available)
        if (typeof window !== 'undefined' && 'gtag' in window) {
          const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
          gtag('event', metric.name, {
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            event_label: metric.id,
            non_interaction: true,
          });
        }
      };

      onCLS(report);
      onINP(report);
      onLCP(report);
      onFCP(report);
      onTTFB(report);
    }).catch(() => {
      // web-vitals not available — fail silently
    });
  }, []);

  return null;
}


