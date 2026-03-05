import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Generate a persistent visitor ID
function getVisitorId(): string {
  let vid = localStorage.getItem("_vid");
  if (!vid) {
    vid = crypto.randomUUID();
    localStorage.setItem("_vid", vid);
  }
  return vid;
}

// Generate a session ID (new per browser session)
function getSessionId(): string {
  let sid = sessionStorage.getItem("_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("_sid", sid);
  }
  return sid;
}

export function usePageTracking() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;

    // Skip admin/staff/client portal pages and auth pages
    if (
      path.startsWith("/admin") ||
      path.startsWith("/staff") ||
      path.startsWith("/app") ||
      path.startsWith("/auth") ||
      path.startsWith("/ares")
    ) {
      return;
    }

    // Avoid duplicate tracking on same path
    if (lastPath.current === path) return;
    lastPath.current = path;

    const trackView = async () => {
      try {
        await supabase.from("page_views").insert({
          path,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          session_id: getSessionId(),
          visitor_id: getVisitorId(),
        });
      } catch (e) {
        // Silently fail — analytics should never break the app
      }
    };

    // Small delay to not block rendering
    const timer = setTimeout(trackView, 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);
}
