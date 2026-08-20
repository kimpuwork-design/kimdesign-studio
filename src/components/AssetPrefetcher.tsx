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
    // We only prefetch the actual URL that will be used.
    // Logic matches Home.tsx PortraitHero component.
    Promise.all([
      supabase.from("settings").select("hero_portrait_url").maybeSingle(),
      supabase.from("site_content").select("content").eq("section", "about_me").maybeSingle()
    ]).then(([settingsRes, aboutRes]) => {
      const settings = settingsRes.data;
      const aboutMe = aboutRes.data?.content as any;
      const portrait = aboutMe?.profile_image_url || settings?.hero_portrait_url;

      if (portrait) {
        const img = new Image();
        img.src = portrait;
      }
    });

    // 2. Prefetch Portfolio Above-the-fold (Top 4 projects)
    // We only fetch the top 4 which are likely visible immediately.
    supabase.from("projects")
      .select("thumbnail_url, is_featured")
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        (data || []).forEach(p => {
          if (p.thumbnail_url) {
            // Logic matches GridCard in Portfolio.tsx
            const width = p.is_featured ? 1280 : 720;
            const url = thumbUrl(p.thumbnail_url, { width });
            const img = new Image();
            img.src = url;
          }
        });
      });
  }, []);

  return null;
}
