/**
 * Image URL helpers — Supabase storage image transforms.
 *
 * For URLs served from Supabase storage (`/storage/v1/object/` or
 * `/storage/v1/render/image/`), rewrite to the render endpoint and
 * attach width/quality. For everything else, return as-is.
 *
 * Bandwidth wins are large: a 4 MB hero JPEG served as a 720-wide
 * tile is ~80% smaller.
 */
export function thumbUrl(
  url: string | null | undefined,
  opts: { width?: number; quality?: number; resize?: "cover" | "contain" | "fill" } = {},
): string {
  if (!url) return "";
  if (!url.includes("/storage/v1/")) return url;

  const { width = 720, quality = 75, resize = "cover" } = opts;

  try {
    const u = new URL(url, window.location.origin);
    // Rewrite object → render/image (preserves /sign/ token if present)
    u.pathname = u.pathname.replace("/storage/v1/object/", "/storage/v1/render/image/");
    u.searchParams.set("width", String(width));
    u.searchParams.set("quality", String(quality));
    u.searchParams.set("resize", resize);
    return u.toString();
  } catch {
    return url;
  }
}
