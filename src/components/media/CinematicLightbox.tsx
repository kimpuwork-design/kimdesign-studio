import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
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

  const prev = useCallback(() => {
    if (total <= 1) return;
    setIdx((i) => (i - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    if (total <= 1) return;
    setIdx((i) => (i + 1) % total);
  }, [total]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onClose]);

  // Touch swipe
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

  const hasError = errorIds.has(current.id);
  const THUMB_H = total > 1 ? 60 : 0; // thumbnail strip height
  const TOP_BAR_H = 44;

  return (
    <div
      className="fixed inset-0 z-[100] select-none"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar — absolute */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 sm:px-5"
        style={{ height: TOP_BAR_H }}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/90 text-xs sm:text-sm font-medium tabular-nums">
          {idx + 1} <span className="text-white/40">/ {total}</span>
          {current.caption && (
            <span className="text-white/50 text-xs ml-2 hidden sm:inline">
              — {current.caption}
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <Download size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main image area */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{
          top: TOP_BAR_H,
          bottom: THUMB_H,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasError ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <ImageOff size={24} className="text-white/50" />
            <p className="text-sm text-white/60">Image failed to load.</p>
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline text-white/80">
              Open directly
            </a>
          </div>
        ) : (
          <img
            key={current.id}
            src={currentUrl}
            alt={current.caption || `Image ${idx + 1}`}
            draggable={false}
            style={{
              display: "block",
              maxWidth: "calc(100% - 1rem)",
              maxHeight: "100%",
              objectFit: "contain",
              margin: "auto",
            }}
            onError={() => setErrorIds((prev) => new Set(prev).add(current.id))}
          />
        )}
      </div>

      {/* Nav arrows — desktop only */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 items-center justify-center text-white/80 hover:bg-white/20 transition-colors active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/10 items-center justify-center text-white/80 hover:bg-white/20 transition-colors active:scale-95"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Thumbnail strip — absolute bottom */}
      {total > 1 && (
        <div
          className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-center px-3 overflow-x-auto"
          style={{ height: THUMB_H, scrollbarWidth: "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-1.5">
            {images.map((img, i) => (
              <button
                key={`${img.id}-${i}`}
                onClick={() => setIdx(i)}
                className={`shrink-0 rounded overflow-hidden transition-all ${
                  i === idx
                    ? "ring-2 ring-white opacity-100 w-10 h-10 sm:w-12 sm:h-12"
                    : "opacity-40 hover:opacity-70 w-9 h-9 sm:w-11 sm:h-11"
                }`}
              >
                <img
                  src={img.image_url}
                  alt=""
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
  );
}
