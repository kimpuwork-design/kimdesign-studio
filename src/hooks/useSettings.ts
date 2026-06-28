import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudioSettings } from "@/lib/portfolio";

const cache: { data: StudioSettings | null; loaded: boolean } = { data: null, loaded: false };

export function useSettings() {
  const [settings, setSettings] = useState<StudioSettings | null>(cache.data);
  const [loading, setLoading] = useState(!cache.loaded);

  useEffect(() => {
    if (cache.loaded) { setSettings(cache.data); setLoading(false); return; }
    supabase.from("settings").select("id, studio_name, logo_url, tagline, address, facebook_url, instagram_url, behance_url, created_at").maybeSingle().then(({ data }) => {
      cache.data = data as StudioSettings | null;
      cache.loaded = true;
      setSettings(cache.data);
      setLoading(false);
    });
  }, []);

  return { settings, loading };
}
