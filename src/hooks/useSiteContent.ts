import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SiteContentMap = Record<string, any>;

export function useSiteContent(...sections: string[]) {
  const [content, setContent] = useState<SiteContentMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stabilize sections array across renders so the effect doesn't loop.
  const key = sections.join(",");
  const stableSections = useMemo(() => sections, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from("site_content")
      .select("section, content")
      .in("section", stableSections)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          console.error("useSiteContent error:", err.message);
          setError(err.message);
          setLoading(false);
          return;
        }
        const map: SiteContentMap = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (data ?? []).forEach((row: any) => {
          map[row.section] = row.content;
        });
        setContent(map);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stableSections]);

  return { content, loading, error };
}
