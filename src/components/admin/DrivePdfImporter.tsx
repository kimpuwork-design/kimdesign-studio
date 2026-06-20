import { useState } from "react";
import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Download, AlertCircle } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface Props {
  projectId: string;
  onImported?: () => void;
}

const DRIVE_HINT =
  "Paste a public Google Drive PDF link. Pages render in your browser, then save as gallery images.";

const JPEG_QUALITY = 0.82;
const MAX_RENDER_WIDTH = 1600;

async function bufferFromFunctionResponse(data: unknown): Promise<ArrayBuffer> {
  if (data instanceof ArrayBuffer) return data;
  if (data instanceof Blob) return data.arrayBuffer();
  throw new Error("The PDF could not be downloaded from Drive.");
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
  if (!blob) throw new Error("Could not render this PDF page as an image.");
  return blob;
}

export function DrivePdfImporter({ projectId, onImported }: Props) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [replace, setReplace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);
    if (!url.trim()) {
      setError("Drive link is required.");
      return;
    }
    if (!/drive\.google\.com|docs\.google\.com/.test(url)) {
      setError("That doesn't look like a Google Drive URL.");
      return;
    }

    setLoading(true);
    setProgress("Downloading PDF…");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("import-drive-pdf", {
        body: { project_id: projectId, drive_url: url.trim(), replace },
        responseType: "arrayBuffer",
      } as never);
      if (fnErr) throw new Error(fnErr.message || "Import failed");
      const pdfBuffer = await bufferFromFunctionResponse(data);
      const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;
      const totalPages = pdf.numPages;
      if (!totalPages) throw new Error("PDF has no pages.");

      const { data: lastRows } = await supabase
        .from("portfolio_gallery")
        .select("sort_order")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: false })
        .limit(1);
      const baseOrder = lastRows && lastRows.length > 0 ? (lastRows[0].sort_order ?? 0) + 1 : 0;
      const importId = crypto.randomUUID().slice(0, 8);
      let imported = 0;

      for (let pageIndex = 1; pageIndex <= totalPages; pageIndex++) {
        setProgress(`Rendering page ${pageIndex} of ${totalPages}…`);
        const page = await pdf.getPage(pageIndex);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.5, MAX_RENDER_WIDTH / baseViewport.width);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Your browser could not create an image canvas.");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: context, viewport }).promise;
        const blob = await canvasToJpegBlob(canvas);
        canvas.width = 1;
        canvas.height = 1;
        page.cleanup();

        const pageNum = String(pageIndex).padStart(3, "0");
        const path = `pdf-pages/${projectId}/${importId}/page-${pageNum}.jpg`;
        setProgress(`Saving page ${pageIndex} of ${totalPages}…`);
        const { error: uploadError } = await supabase.storage.from("portfolio").upload(path, blob, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
          upsert: true,
        });
        if (uploadError) throw new Error(`Upload failed on page ${pageIndex}: ${uploadError.message}`);

        const { data: publicData } = supabase.storage.from("portfolio").getPublicUrl(path);
        const { error: insertError } = await supabase.from("portfolio_gallery").insert({
          project_id: projectId,
          image_url: publicData.publicUrl,
          sort_order: baseOrder + pageIndex - 1,
          caption: `Page ${pageIndex}`,
        });
        if (insertError) throw new Error(`Database insert failed on page ${pageIndex}: ${insertError.message}`);
        imported += 1;
      }

      pdf.destroy();

      toast({
        title: `Imported ${imported} page${imported === 1 ? "" : "s"}`,
        description: "Pages are now in the gallery below.",
      });
      setUrl("");
      setReplace(false);
      onImported?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
      toast({ title: "Import failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="rounded-xl border border-portal-border bg-portal-surface p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-lg bg-portal-accent/10 p-2 text-portal-accent">
          <FileText size={18} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-portal-text text-sm">Import from Google Drive PDF</h3>
          <p className="text-xs text-portal-text-muted mt-0.5">{DRIVE_HINT}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://drive.google.com/file/d/.../view"
          disabled={loading}
          className="flex-1 rounded-md border border-portal-border bg-portal-bg px-3 py-2 text-sm text-portal-text placeholder:text-portal-text-muted/60 focus:outline-none focus:border-portal-accent disabled:opacity-50"
        />
        <button
          onClick={handleImport}
          disabled={loading || !url.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-portal-accent px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-portal-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {loading ? "Importing…" : "Import pages"}
        </button>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs text-portal-text-muted cursor-pointer select-none">
        <input
          type="checkbox"
          checked={replace}
          onChange={(e) => setReplace(e.target.checked)}
          disabled={loading}
          className="rounded border-portal-border"
        />
        Replace previously imported PDF pages for this project
      </label>

      {loading && (
        <p className="mt-3 text-xs text-portal-text-muted">
          {progress ?? "Converting PDF pages to images…"}
        </p>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
