import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Download, ImageOff, Loader2 } from "lucide-react";

export interface LightboxImage {
  id: string;
  image_url: string;
  caption?: string;
}

interface Props {
  images: LightboxImage[];
  startIndex: number;
  onClose: () => void;
}

const SWIPE_THRESHOLD = 50;

export function CinematicLightbox({ images, startIndex, onClose }: Props) {
  const total = images.length;

  const clampIndex = useCallback(
    (value: number) => {
      if (total <= 0) return 0;
      return Math.min(Math.max(value, 0), total - 1);
    },
    [total]
  );

  const [idx, setIdx] = useState(() => clampIndex(startIndex));
  const [loadState, setLoadState] = useState<"loading" | "loaded" | "error">("loading");
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    setIdx(clampIndex(startIndex));
  }, [startIndex, total, clampIndex]);

  const current = images[idx];

  const currentUrl = useMemo(() => {
    const raw = current?.image_url?.trim() ?? "";
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/")) return `${window.location.origin}${raw}`;
    return raw;
  }, [current?.image_url]);

  useEffect(() => {
    setLoadState("loading");
  }, [current?.id, currentUrl]);

  const prev = useCallback(() => {
    if (total <= 1) return;
    setIdx((i) => (i - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    if (total <= 1) return;
    setIdx((i) => (i + 1) % total);
  }, [total]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStart.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) dx < 0 ? next() : prev();
    touchStart.current = null;
  };

  const handleDownload = () => {
    if (!currentUrl) return;
    const a = document.createElement("a");
    a.href = currentUrl;
    a.download = `image-${idx + 1}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm select-none"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Mobile: full-screen layout · Desktop: popup modal ── */}
      <div
        className="relative flex flex-col overflow-hidden
          w-full h-full
          sm:w-auto sm:h-auto sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl sm:max-w-[92vw] sm:max-h-[92vh]
          bg-black sm:bg-card/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-black/60 sm:bg-muted/50 border-b border-white/10 sm:border-border shrink-0 safe-area-top">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="text-white sm:text-foreground text-xs sm:text-sm font-medium tabular-nums shrink-0">
              {idx + 1} <span className="text-white/50 sm:text-muted-foreground">/ {total}</span>
            </span>
            {current.caption && (
              <span className="text-white/60 sm:text-muted-foreground text-xs sm:text-sm hidden sm:inline truncate max-w-[300px]">
                — {current.caption}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              title="Download"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 sm:bg-secondary flex items-center justify-center text-white/70 sm:text-muted-foreground hover:text-white sm:hover:text-foreground transition-colors"
            >
              <Download size={15} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 sm:bg-secondary flex items-center justify-center text-white/70 sm:text-muted-foreground hover:text-white sm:hover:text-foreground transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden min-h-0 bg-black sm:bg-foreground/95">
          {loadState === "loading" && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 size={24} className="animate-spin text-white/80 sm:text-background/80" />
            </div>
          )}

          {loadState === "error" ? (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
              <ImageOff size={24} className="text-white/70" />
              <p className="text-sm text-white/70">Image failed to load.</p>
              <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-white">
                Open image directly
              </a>
            </div>
          ) : (
            <img
              key={current.id}
              src={currentUrl}
              alt={current.caption || `Image ${idx + 1}`}
              draggable={false}
              className={`block object-contain p-2 sm:p-4 transition-opacity duration-200 ${
                loadState === "loaded" ? "opacity-100" : "opacity-0"
              }`}
              style={{
                maxWidth: "100%",
                maxHeight: "calc(100vh - 7rem)",
              }}
              onLoad={() => setLoadState("loaded")}
              onError={() => setLoadState("error")}
            />
          )}
        </div>

        {/* Nav arrows — hidden on mobile (use swipe), visible on desktop */}
        {total > 1 && (
          <div className="absolute inset-y-0 inset-x-0 hidden sm:flex items-center justify-between pointer-events-none px-2 sm:px-4">
            <button
              onClick={prev}
              className="pointer-events-auto w-11 h-11 rounded-full bg-secondary/90 flex items-center justify-center text-foreground hover:bg-secondary transition-colors active:scale-95"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={next}
              className="pointer-events-auto w-11 h-11 rounded-full bg-secondary/90 flex items-center justify-center text-foreground hover:bg-secondary transition-colors active:scale-95"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        )}

        {/* Thumbnail strip */}
        {total > 1 && (
          <div className="shrink-0 bg-black/60 sm:bg-muted/40 border-t border-white/10 sm:border-border px-3 sm:px-4 py-2 sm:py-3 safe-area-bottom">
            <div className="flex gap-1.5 sm:gap-2 overflow-x-auto justify-center" style={{ scrollbarWidth: "none" }}>
              {images.map((img, i) => (
                <button
                  key={`${img.id}-${i}`}
                  onClick={() => setIdx(i)}
                  className={`shrink-0 w-10 h-10 sm:w-14 sm:h-14 rounded-md sm:rounded-lg overflow-hidden border-2 transition-all ${
                    i === idx ? "border-primary opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img
                    src={img.image_url}
                    alt={img.caption || `Thumbnail ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
