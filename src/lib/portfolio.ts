import { supabase } from "@/integrations/supabase/client";

export interface PortfolioItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string | null;
  cover_image_url: string;
  tags: string[];
  category: string | null;
  location: string | null;
  year: number | null;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  gallery?: GalleryImage[];
}

export interface GalleryImage {
  id: string;
  portfolio_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
  caption?: string | null;
}

export interface StudioSettings {
  id: string;
  studio_name: string;
  contact_email: string;
  logo_url: string | null;
  tagline: string | null;
  phone: string | null;
  address: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  behance_url: string | null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
    .substring(0, 80);
}

export async function uploadPortfolioImage(
  file: File,
  portfolioId: string,
  folder: "cover" | "gallery"
): Promise<string | null> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const path = `${portfolioId}/${folder}/${Date.now()}_${file.name}`;

  const { error } = await supabase.storage
    .from("portfolio")
    .upload(path, file, { upsert: false });

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
  return data.publicUrl;
}

export function getPortfolioImageUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
  return data.publicUrl;
}
