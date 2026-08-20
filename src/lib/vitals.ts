
import { onLCP, onFID, onCLS, onFCP, onTTFB, Metric } from 'web-vitals';
import { supabase } from '@/integrations/supabase/client';

/**
 * Sends performance metrics to the backend.
 * In a real-world scenario, we'd log this to a 'web_vitals' table
 * to monitor LCP and CLS improvements over time.
 */
function sendToAnalytics(metric: Metric) {
  const body = {
    name: metric.name,
    value: metric.value,
    id: metric.id,
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  // Log to console for dev verification
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value, body);
  }

  // Attempt to log to a hypothetical 'page_vitals' table if it exists
  // This is non-blocking and fails silently if the table isn't ready
  supabase.from('page_views' as any).insert({
    path: window.location.pathname,
    meta: {
      vital_name: metric.name,
      vital_value: metric.value,
      vital_id: metric.id
    }
  } as any).then(({ error }) => {
    if (error && process.env.NODE_ENV === 'development') {
      console.warn('Failed to log vital to page_views:', error.message);
    }
  });
}

export function reportWebVitals() {
  try {
    onFID(sendToAnalytics);
    onLCP(sendToAnalytics);
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (err) {
    console.error('[Web Vitals] Failed to initialize:', err);
  }
}
