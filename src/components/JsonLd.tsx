import { useSettings } from "@/hooks/useSettings";

export function ArchitectureBusinessJsonLd() {
  const { settings } = useSettings();
  const name = settings?.studio_name ?? "KIM DESIGN STUDIO";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ArchitectureFirm",
    name,
    description: settings?.tagline ?? "Professional Architecture & Design Studio",
    email: settings?.contact_email,
    telephone: settings?.phone,
    address: settings?.address ? {
      "@type": "PostalAddress",
      streetAddress: settings.address,
      addressCountry: "MM",
    } : undefined,
    url: window.location.origin,
    sameAs: [settings?.facebook_url, settings?.instagram_url, settings?.behance_url].filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
