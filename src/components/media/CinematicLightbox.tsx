import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, ImageOff, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

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
const MAX_ZOOM = 4;
const MIN_ZOOM = 1;

function resolveUrl(raw: string) {
  const v = raw?.trim() ?? "";
  if (!v) return "";
  if (v.startsWith("http") || v.startsWith("data:") || v.startsWith("blob:")) return v;
  if (v.startsWith("/")) return `${window.location.origin}${v}`;
  return v;
}

export function CinematicLightbox({ images, startIndex, onClose }: Props) {
  const total = images.length;
  const clampIndex = useCallback(
    (v: number) => (total <= 0 ? 0 : Math.min(Math.max(v, 0), total - 1)),
    [total]
  );

  const [idx, setIdx] = useState(() => clampIndex(startIndex));
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState<1 | -1>(1);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);

  useEffect(() => { setIdx(clampIndex(startIndex)); }, [startIndex, total, clampIndex]);

  // Reset zoom/pan when image changes
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [idx]);

  const current = images[idx];
  const currentUrl = useMemo(() => resolveUrl(current?.image_url ?? ""), [current?.image_url]);

  // Preload neighbors
  useEffect(() => {
    if (total <= 1) return;
    const nextIdx = (idx + 1) % total;
    const prevIdx = (idx - 1 + total) % total;
    [nextIdx, prevIdx].forEach((i) => {
      const u = resolveUrl(images[i]?.image_url ?? "");
      if (!u) return;
      const im = new Image();
      im.src = u;
    });
  }, [idx, total, images]);

  const prev = useCallback(() => {
    if (total > 1) { setDirection(-1); setIdx((i) => (i - 1 + total) % total); }
  }, [total]);
  const next = useCallback(() => {
    if (total > 1) { setDirection(1); setIdx((i) => (i + 1) % total); }
  }, [total]);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.5, MAX_ZOOM)), []);
  const zoomOut = useCallback(() => setZoom((z) => {
    const nz = Math.max(z - 0.5, MIN_ZOOM);
    if (nz === 1) setPan({ x: 0, y: 0 });
    return nz;
  }), []);
  const resetZoom = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // Lock body scroll
  useEffect(() => {
    const s = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = s; };
  }, []);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev, onClose, zoomIn, zoomOut, resetZoom]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setZoom((z) => {
      const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta * z));
      if (nz <= 1) setPan({ x: 0, y: 0 });
      return nz;
    });
  }, []);

  // Drag to pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart.current) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.x),
      y: dragStart.current.py + (e.clientY - dragStart.current.y),
    });
  };
  const handleMouseUp = () => { dragStart.current = null; };

  // Touch handlers (swipe + pinch + pan)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = { dist: Math.hypot(dx, dy), zoom };
      touchStartX.current = null;
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      if (zoom > 1) {
        dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, px: pan.x, py: pan.y };
      }
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStart.current.zoom * (d / pinchStart.current.dist)));
      setZoom(nz);
      if (nz <= 1) setPan({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && dragStart.current && zoom > 1) {
      setPan({
        x: dragStart.current.px + (e.touches[0].clientX - dragStart.current.x),
        y: dragStart.current.py + (e.touches[0].clientY - dragStart.current.y),
      });
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    pinchStart.current = null;
    if (dragStart.current) { dragStart.current = null; return; }
    if (touchStartX.current === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    const dy = (e.changedTouches[0]?.clientY ?? 0) - (touchStartY.current ?? 0);
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) && zoom <= 1) {
      dx < 0 ? next() : prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!current) return null;
  const hasError = errorIds.has(current.id);
  const isLoaded = loaded.has(current.id);

  const content = (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(8,8,8,0.97)",
        backdropFilter: "blur(8px)",
        display: "flex", flexDirection: "column",
        height: "100dvh", maxHeight: "100dvh",
        overflow: "hidden",
        touchAction: "none",
        animation: "lbFade 280ms cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      <style>{`
        @keyframes lbFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lbSlideR { from { opacity: 0; transform: translateX(40px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes lbSlideL { from { opacity: 0; transform: translateX(-40px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
        .lb-btn { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.85); transition: background 200ms ease, transform 200ms ease; backdrop-filter: blur(10px); }
        .lb-btn:hover { background: rgba(255,255,255,0.18); transform: scale(1.05); }
        .lb-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .lb-nav { width: 48px; height: 48px; }
      `}</style>

      {/* Top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 18px", flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ color: "rgba(255,255,255,0.95)", fontSize: 13, fontWeight: 500, letterSpacing: "0.05em", fontFamily: "system-ui, sans-serif", fontVariantNumeric: "tabular-nums" }}>
            {String(idx + 1).padStart(2, "0")}
            <span style={{ color: "rgba(255,255,255,0.35)", margin: "0 6px" }}>/</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>{String(total).padStart(2, "0")}</span>
          </span>
          {current.caption && (
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, maxWidth: 320, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {current.caption}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="lb-btn" onClick={(e) => { e.stopPropagation(); zoomOut(); }} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">
            <ZoomOut size={15} />
          </button>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, minWidth: 36, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="lb-btn" onClick={(e) => { e.stopPropagation(); zoomIn(); }} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">
            <ZoomIn size={15} />
          </button>
          {zoom !== 1 && (
            <button className="lb-btn" onClick={(e) => { e.stopPropagation(); resetZoom(); }} aria-label="Reset zoom">
              <Maximize2 size={14} />
            </button>
          )}
          <button className="lb-btn" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Image area */}
      <div
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", padding: "0 12px", minHeight: 0, position: "relative",
          cursor: zoom > 1 ? (dragStart.current ? "grabbing" : "grab") : "default",
        }}
      >
        {hasError ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
            <ImageOff size={28} style={{ margin: "0 auto 10px" }} />
            <p style={{ fontSize: 13 }}>Image failed to load</p>
          </div>
        ) : (
          <>
            {!isLoaded && (
              <div style={{ position: "absolute", color: "rgba(255,255,255,0.4)" }}>
                <div style={{
                  width: 28, height: 28, border: "2px solid rgba(255,255,255,0.15)",
                  borderTopColor: "rgba(255,255,255,0.7)", borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            <div
              key={current.id}
              style={{
                position: "relative",
                animation: `${direction === 1 ? "lbSlideR" : "lbSlideL"} 380ms cubic-bezier(0.22,1,0.36,1)`,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: dragStart.current || pinchStart.current ? "none" : "transform 240ms cubic-bezier(0.22,1,0.36,1)",
                willChange: "transform",
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              <img
                src={currentUrl}
                alt={current.caption || `Image ${idx + 1}`}
                draggable={false}
                onLoad={() => setLoaded((p) => new Set(p).add(current.id))}
                onError={() => setErrorIds((p) => new Set(p).add(current.id))}
                style={{
                  display: "block", maxWidth: "92vw", maxHeight: "78vh",
                  objectFit: "contain", userSelect: "none",
                  WebkitUserDrag: "none", pointerEvents: "none",
                  opacity: isLoaded ? 1 : 0,
                  transition: "opacity 250ms ease",
                } as React.CSSProperties}
              />
            </div>
          </>
        )}
      </div>

      {/* Desktop nav arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="lb-btn lb-nav"
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", display: "none" }}
            aria-label="Previous"
            data-desktop-nav
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="lb-btn lb-nav"
            style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", display: "none" }}
            aria-label="Next"
            data-desktop-nav
          >
            <ChevronRight size={20} />
          </button>
          <style>{`
            @media (min-width: 640px) { [data-desktop-nav] { display: flex !important; } }
          `}</style>
        </>
      )}

      {/* Thumbnails */}
      {total > 1 && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            flexShrink: 0, padding: "10px 12px 14px",
            display: "flex", justifyContent: "center",
            overflowX: "auto", gap: 6,
            scrollbarWidth: "none",
          }}
        >
          {images.map((img, i) => (
            <button
              key={`${img.id}-${i}`}
              onClick={() => { setDirection(i > idx ? 1 : -1); setIdx(i); }}
              style={{
                flexShrink: 0,
                width: i === idx ? 56 : 44,
                height: i === idx ? 56 : 44,
                overflow: "hidden",
                border: i === idx ? "2px solid rgba(255,255,255,0.95)" : "1px solid rgba(255,255,255,0.1)",
                opacity: i === idx ? 1 : 0.45,
                cursor: "pointer",
                padding: 0,
                background: "transparent",
                transition: "all 250ms cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <img
                src={resolveUrl(img.image_url)}
                alt=""
                draggable={false}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
