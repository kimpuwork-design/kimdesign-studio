import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";

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
  const [idx, setIdx] = useState(startIndex);
  const touchStart = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const current = images[idx];
  const total = images.length;

  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);
  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Reset scroll position on image change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
      scrollRef.current.scrollLeft = 0;
    }
  }, [idx]);

  // Keyboard navigation
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
    touchStart.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      dx < 0 ? next() : prev();
    }
    touchStart.current = null;
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = current.image_url;
    a.download = `image-${idx + 1}`;
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm select-none" onClick={onClose}>
      <div
        className="relative flex flex-col bg-black/95 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ maxWidth: "92vw", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white/90 text-sm font-medium tabular-nums">
            {idx + 1} <span className="text-white/40">/ {total}</span>
          </span>
          {current.caption && (
            <span className="text-white/60 text-sm hidden sm:inline truncate max-w-[300px]">
              — {current.caption}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleDownload}
            title="Download"
            className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-white/70 hover:bg-white/[0.15] hover:text-white transition-colors"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onClose}
            title="Close"
            className="w-9 h-9 rounded-full bg-white/[0.08] flex items-center justify-center text-white/70 hover:bg-white/[0.15] hover:text-white transition-colors ml-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Image area — scrollable for oversized images */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto flex items-start justify-center p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => {
          if (e.target === scrollRef.current) onClose();
        }}
      >
        <img
          key={current.id}
          src={current.image_url}
          alt={current.caption || `Image ${idx + 1}`}
          draggable={false}
          className="block"
          style={{ width: "auto", height: "auto" }}
        />
      </div>

      {/* Nav arrows */}
      {total > 1 && (
        <div className="absolute inset-y-0 inset-x-0 flex items-center justify-between pointer-events-none px-2 sm:px-4">
          <button
            onClick={prev}
            className="pointer-events-auto w-12 h-12 rounded-full bg-white/[0.1] backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-colors active:scale-95"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={next}
            className="pointer-events-auto w-12 h-12 rounded-full bg-white/[0.1] backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-white/20 hover:text-white transition-colors active:scale-95"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div className="shrink-0 bg-black/60 border-t border-white/10 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto justify-center" style={{ scrollbarWidth: "none" }}>
            {images.map((img, i) => (
              <button
                key={img.id + i}
                onClick={() => setIdx(i)}
                className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                  i === idx
                    ? "border-white opacity-100 scale-110"
                    : "border-transparent opacity-40 hover:opacity-80"
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
