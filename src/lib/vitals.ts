import { onLCP, onCLS, onFCP, onTTFB, Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

type WebVitalCallback = (metric: Metric) => void;
const callbacks: Set<WebVitalCallback> = new Set();

/**
 * Register a listener for web vital updates.
 * Used by the DebugPanel to show real-time metrics.
 */
export function subscribeToVitals(cb: WebVitalCallback) {
  callbacks.add(cb);
  return () => callbacks.delete(cb);
}

/**
 * Sends performance metrics to the backend.
 */
function sendToAnalytics(metric: Metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  // Notify local subscribers (debug panel)
  callbacks.forEach(cb => cb(metric));

  // Log to console for dev verification
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, body);
  }

  // Log to page_views table for long-term tracking
  supabase.from('page_views' as any).insert({
    path: window.location.pathname,
    meta: {
      vital_name: metric.name,
      vital_value: metric.value,
      vital_id: metric.id,
      vital_rating: metric.rating,
      timestamp: body.timestamp
    }
  } as any).catch(err => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('Failed to log vital:', err);
    }
  });
}

export function reportWebVitals() {
  try {
    // reportAllChanges: true allows us to see metrics update in real-time
    onLCP(sendToAnalytics, { reportAllChanges: true });
    onCLS(sendToAnalytics, { reportAllChanges: true });
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[Web Vitals] Failed to initialize:', err);
  }
}

