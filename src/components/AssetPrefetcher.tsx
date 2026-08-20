import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { thumbUrl } from "@/lib/images";

/**
 * Prefetcher component that warms up the browser cache for critical assets.
 * Placed in App.tsx or similar high-level layout.
 */
export function AssetPrefetcher() {
  useEffect(() => {
    // 1. Prefetch Home Hero Portrait (Settings/About Me)
    supabase.from("settings").select("hero_portrait_url").maybeSingle().then(({ data }) => {
      if (data?.hero_portrait_url) {
        const img = new Image();
        img.src = data.hero_portrait_url;
      }
    });

    supabase.from("site_content").select("content").eq("section", "about_me").maybeSingle().then(({ data }) => {
      const profileUrl = (data?.content as any)?.profile_image_url;
      if (profileUrl) {
        const img = new Image();
        img.src = profileUrl;
      }
    });

    // 2. Prefetch Top 3 Featured Portfolio Thumbnails
    supabase.from("projects")
      .select("thumbnail_url")
      .eq("is_public", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        (data || []).forEach(p => {
          if (p.thumbnail_url) {
            // Featured thumbnails in portfolio are width 1280
            const url = thumbUrl(p.thumbnail_url, { width: 1280 });
            const img = new Image();
            img.src = url;
          }
        });
      });
  }, []);

  return null;
}
