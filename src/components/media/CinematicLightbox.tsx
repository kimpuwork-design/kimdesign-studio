import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download, ImageOff } from "lucide-react";

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
  const [failedIds, setFailedIds] = useState<Record<string, boolean>>({});
  const touchStart = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIdx(clampIndex(startIndex));
  }, [startIndex, total, clampIndex]);

  const current = images[idx];

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
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = 0;
    scrollRef.current.scrollLeft = 0;
  }, [idx]);

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
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      dx < 0 ? next() : prev();
    }
    touchStart.current = null;
  };

  const handleDownload = () => {
    if (!current?.image_url) return;
    const a = document.createElement("a");
    a.href = current.image_url;
    a.download = `image-${idx + 1}`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  if (!current) return null;

  const failed = failedIds[current.id] === true;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col bg-card/95 rounded-2xl border border-border shadow-2xl overflow-hidden"
        style={{ maxWidth: "92vw", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-foreground text-sm font-medium tabular-nums shrink-0">
              {idx + 1} <span className="text-muted-foreground">/ {total}</span>
            </span>
            {current.caption && (
              <span className="text-muted-foreground text-sm hidden sm:inline truncate max-w-[300px]">
                — {current.caption}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              title="Download"
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download size={16} />
            </button>
            <button
              onClick={onClose}
              title="Close"
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-auto min-h-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {failed ? (
            <div className="h-full min-h-[320px] flex flex-col items-center justify-center gap-3 p-6 text-center">
              <ImageOff size={24} className="text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Image failed to load.</p>
              <a
                href={current.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline text-foreground"
              >
                Open image directly
              </a>
            </div>
          ) : (
            <img
              key={current.id}
              src={current.image_url}
              alt={current.caption || `Image ${idx + 1}`}
              draggable={false}
              className="block m-auto p-4"
              style={{ width: "auto", height: "auto" }}
              onError={() => setFailedIds((prevState) => ({ ...prevState, [current.id]: true }))}
            />
          )}
        </div>

        {total > 1 && (
          <div className="absolute inset-y-0 inset-x-0 flex items-center justify-between pointer-events-none px-2 sm:px-4">
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

        {total > 1 && (
          <div className="shrink-0 bg-muted/40 border-t border-border px-4 py-3">
            <div className="flex gap-2 overflow-x-auto justify-center" style={{ scrollbarWidth: "none" }}>
              {images.map((img, i) => (
                <button
                  key={`${img.id}-${i}`}
                  onClick={() => setIdx(i)}
                  className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    i === idx
                      ? "border-primary opacity-100 scale-105"
                      : "border-transparent opacity-50 hover:opacity-80"
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
