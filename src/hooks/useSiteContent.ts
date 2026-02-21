import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type SiteContentMap = Record<string, any>;

export function useSiteContent(...sections: string[]) {
  const [content, setContent] = useState<SiteContentMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("section, content")
      .in("section", sections)
      .then(({ data }) => {
        const map: SiteContentMap = {};
        data?.forEach((row: any) => {
          map[row.section] = row.content;
        });
        setContent(map);
        setLoading(false);
      });
  }, [sections.join(",")]);

  return { content, loading };
}
