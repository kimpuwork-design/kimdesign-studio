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
    (v: number) => (total <= 0 ? 0 : Math.min(Math.max(v, 0), total - 1)),
    [total]
  );

  const [idx, setIdx] = useState(() => clampIndex(startIndex));
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  const touchStartX = useRef<number | null>(null);

  useEffect(() => { setIdx(clampIndex(startIndex)); }, [startIndex, total, clampIndex]);

  const current = images[idx];
  const currentUrl = useMemo(() => {
    const raw = current?.image_url?.trim() ?? "";
    if (!raw) return "";
    if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
    if (raw.startsWith("/")) return `${window.location.origin}${raw}`;
    return raw;
  }, [current?.image_url]);

  const prev = useCallback(() => { if (total > 1) setIdx((i) => (i - 1 + total) % total); }, [total]);
  const next = useCallback(() => { if (total > 1) setIdx((i) => (i + 1) % total); }, [total]);

  useEffect(() => {
    const s = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = s; };
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev, onClose]);

  if (!current) return null;
  const hasError = errorIds.has(current.id);

  return (
    <div
      onTouchStart={(e) => { touchStartX.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        if (Math.abs(dx) > SWIPE_THRESHOLD) dx < 0 ? next() : prev();
        touchStartX.current = null;
      }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.95)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          flexShrink: 0,
        }}
      >
        <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 13, fontWeight: 500 }}>
          {idx + 1} <span style={{ color: "rgba(255,255,255,0.4)" }}>/ {total}</span>
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => {
              if (!currentUrl) return;
              const a = document.createElement("a");
              a.href = currentUrl; a.download = `image-${idx + 1}`; a.target = "_blank"; a.click();
            }}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Download size={14} color="rgba(255,255,255,0.7)" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={14} color="rgba(255,255,255,0.7)" />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          padding: 8,
          minHeight: 0,
        }}
      >
        {hasError ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
            <ImageOff size={24} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 14 }}>Image failed to load</p>
            <a href={currentUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#fff", fontSize: 13, textDecoration: "underline" }}>
              Open directly
            </a>
          </div>
        ) : (
          <img
            key={current.id}
            src={currentUrl}
            alt={current.caption || `Image ${idx + 1}`}
            draggable={false}
            onError={() => setErrorIds((p) => new Set(p).add(current.id))}
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: 4,
              // Override global img transitions that might interfere
              transition: "none",
              opacity: 1,
              transform: "none",
            }}
          />
        )}
      </div>

      {/* Desktop nav arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center" }}
            className="!hidden sm:!flex"
          >
            <ChevronLeft size={20} color="rgba(255,255,255,0.8)" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center" }}
            className="!hidden sm:!flex"
          >
            <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
          </button>
        </>
      )}

      {/* Thumbnail strip */}
      {total > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            flexShrink: 0,
            padding: "6px 8px",
            display: "flex",
            justifyContent: "center",
            overflowX: "auto",
            gap: 4,
            scrollbarWidth: "none" as any,
          }}
        >
          {images.map((img, i) => (
            <button
              key={`${img.id}-${i}`}
              onClick={() => setIdx(i)}
              style={{
                flexShrink: 0,
                width: i === idx ? 40 : 36,
                height: i === idx ? 40 : 36,
                borderRadius: 4,
                overflow: "hidden",
                border: i === idx ? "2px solid #fff" : "2px solid transparent",
                opacity: i === idx ? 1 : 0.4,
                cursor: "pointer",
                padding: 0,
                background: "transparent",
                transition: "opacity 0.2s",
              }}
            >
              <img
                src={img.image_url}
                alt=""
                draggable={false}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "none", opacity: 1, transform: "none" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
