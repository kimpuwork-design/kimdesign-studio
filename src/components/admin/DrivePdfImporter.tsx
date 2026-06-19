import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Download, AlertCircle } from "lucide-react";

interface Props {
  projectId: string;
  onImported?: () => void;
}

const DRIVE_HINT =
  "Paste a Google Drive PDF link (sharing set to 'Anyone with the link'). Up to 60 pages, 25 MB.";

export function DrivePdfImporter({ projectId, onImported }: Props) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [replace, setReplace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("import-drive-pdf", {
        body: { project_id: projectId, drive_url: url.trim(), replace },
      });
      if (fnErr) throw new Error(fnErr.message || "Import failed");
      if (data?.error) throw new Error(data.error);

      const imported = data?.imported ?? 0;
      const truncated = data?.truncated === true;
      toast({
        title: `Imported ${imported} page${imported === 1 ? "" : "s"}`,
        description: truncated
          ? `PDF had ${data.total_pages} pages — only the first ${imported} were imported.`
          : "Pages are now in the gallery below.",
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
          className="inline-flex items-center justify-center gap-2 rounded-md bg-portal-accent px-4 py-2 text-sm font-medium text-white hover:bg-portal-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          Converting PDF pages to images… large PDFs may take 30–90 seconds.
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
