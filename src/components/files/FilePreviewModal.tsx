import { useEffect, useState } from "react";
import { X, Loader2, ExternalLink } from "lucide-react";
import { FileIcon } from "./FileIcon";
import { FileAsset, getSignedUrl, isImageExt, isPdfExt } from "@/lib/files";
import { Button } from "@/components/ui/button";

interface Props {
  file: FileAsset;
  onClose: () => void;
  role?: "CLIENT" | "STAFF" | "ADMIN";
}

export function FilePreviewModal({ file, onClose, role = "ADMIN" }: Props) {
  const canDownload = role !== "CLIENT";
  const ext = file.extension ?? "";
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSignedUrl(file.storage_path, 600).then((u) => {
      setUrl(u);
      setLoading(false);
    });
  }, [file.storage_path]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-portal-border bg-portal-bg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-portal-border px-5 py-4">
          <FileIcon ext={ext} size={18} className="text-portal-accent shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-portal-text text-sm">{file.original_name}</p>
            <p className="text-xs text-portal-text-muted">v{file.version}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-portal-text-muted hover:bg-portal-surface hover:text-portal-text transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center justify-center overflow-auto bg-portal-surface/50 p-4" style={{ minHeight: 300 }}>
          {loading ? (
            <Loader2 size={28} className="animate-spin text-portal-text-muted" />
          ) : !url ? (
            <p className="text-portal-text-muted">Failed to load preview.</p>
          ) : isImageExt(ext) ? (
            <img src={url} alt={file.original_name} className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-lg" />
          ) : isPdfExt(ext) ? (
            <iframe src={url} title={file.original_name} className="h-[65vh] w-full rounded-lg border border-portal-border" />
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <FileIcon ext={ext} size={56} className="text-portal-text-muted opacity-50" />
              <p className="text-portal-text-muted text-sm">Preview not available for .{ext} files.</p>
              {canDownload && (
                <Button asChild variant="outline" size="sm">
                  <a href={url} download={file.original_name} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} className="mr-2" />Download file
                  </a>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {url && canDownload && (
          <div className="flex justify-end gap-2 border-t border-portal-border px-5 py-3">
            <Button asChild size="sm" className="bg-portal-accent text-portal-accent-foreground hover:bg-portal-accent/90">
              <a href={url} download={file.original_name} target="_blank" rel="noreferrer">
                <ExternalLink size={13} className="mr-2" />Open / Download
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
