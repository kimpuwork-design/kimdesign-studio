import { supabase } from "@/integrations/supabase/client";

export const ALLOWED_EXTENSIONS = [
  "png", "jpg", "jpeg", "webp", "pdf",
  "dwg", "dxf", "ifc", "skp",
  "zip", "rar", "docx", "xlsx", "txt",
];

export const FILE_CATEGORIES = [
  { value: "site_photos", label: "Site Photos" },
  { value: "drawings", label: "Drawings" },
  { value: "references", label: "References" },
  { value: "contracts", label: "Contracts" },
  { value: "deliverables", label: "Deliverables" },
  { value: "other", label: "Other" },
] as const;

export type FileCategory = (typeof FILE_CATEGORIES)[number]["value"];

export interface FileAsset {
  id: string;
  project_id: string;
  uploader_id: string;
  category: FileCategory;
  original_name: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string | null;
  extension: string | null;
  size_bytes: number;
  version: number;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  uploader?: { full_name: string | null };
  project?: { title: string; profiles: { full_name: string | null; company: string | null } | null };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function isImageExt(ext: string): boolean {
  return ["png", "jpg", "jpeg", "webp"].includes(ext);
}

export function isPdfExt(ext: string): boolean {
  return ext === "pdf";
}

export function validateExtension(filename: string): boolean {
  return ALLOWED_EXTENSIONS.includes(getExtension(filename));
}

export function buildStoragePath(
  projectId: string,
  category: string,
  version: number,
  filename: string
): string {
  const ts = Date.now();
  return `${projectId}/${category}/v${version}/${ts}_${filename}`;
}

export async function getNextVersion(
  projectId: string,
  category: string,
  originalName: string
): Promise<number> {
  const { data } = await supabase
    .from("file_assets")
    .select("version")
    .eq("project_id", projectId)
    .eq("category", category)
    .eq("original_name", originalName)
    .order("version", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? (data[0].version as number) + 1 : 1;
}

/**
 * Get a signed URL via the secure edge function.
 * Requires the user to be authenticated and have project access.
 */
export async function getSignedUrl(
  fileAssetId: string,
  _expiresIn = 300
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("get-project-file-url", {
      body: { file_asset_id: fileAssetId },
    });
    if (error || !data?.signedUrl) {
      console.error("Signed URL error:", error?.message || "No URL returned");
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error("Signed URL fetch error:", err);
    return null;
  }
}

/**
 * Get a signed URL by storage path (fallback for components without file asset ID).
 */
export async function getSignedUrlByPath(
  storagePath: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("get-project-file-url", {
      body: { storage_path: storagePath },
    });
    if (error || !data?.signedUrl) {
      console.error("Signed URL error:", error?.message || "No URL returned");
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error("Signed URL fetch error:", err);
    return null;
  }
}

/**
 * @deprecated - Bucket is now private. Use getSignedUrl() instead.
 * Kept for portfolio bucket or other public buckets only.
 */
export function getPublicUrl(storagePath: string, bucket = "portfolio"): string {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Get a signed URL for a file visible on public pages (no auth required).
 * Uses the public edge function with shorter expiry.
 */
export async function getPublicFileSignedUrl(
  fileAssetId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("get-public-file-url", {
      body: { file_asset_id: fileAssetId },
    });
    if (error || !data?.signedUrl) {
      console.error("Public signed URL error:", error?.message || "No URL");
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error("Public signed URL fetch error:", err);
    return null;
  }
}
