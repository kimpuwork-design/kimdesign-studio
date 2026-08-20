import { useEffect } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/i18n/LanguageContext";

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
}

export function useSEO({ title, description, ogImage, ogType = "website", canonical }: SEOProps) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  
  const studioName = settings?.studio_name ?? "KIM DESIGN STUDIO";
  
  // Use translations for defaults if not provided
  const siteTagline = t("seo_home_description") || "Professional Architecture & Design Studio in Myanmar";
  
  const fullTitle = title ? `${title} | ${studioName}` : studioName;
  const desc = description ?? siteTagline;
  const url = canonical ?? window.location.href;
  const image = ogImage ?? "/favicon.png";

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", desc);
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", desc, "property");
    setMeta("og:type", ogType, "property");
    setMeta("og:url", url, "property");
    setMeta("og:image", image, "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", url);
  }, [fullTitle, desc, url, image, ogType]);
}
