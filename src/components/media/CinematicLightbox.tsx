import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X, ChevronLeft, ChevronRight, ImageOff, ZoomIn, ZoomOut, Maximize2,
  Play, Pause, Grid3X3, Info, Share2, Expand, Minimize, Download,
} from "lucide-react";

export interface LightboxImage {
  id: string;
  image_url: string;
  caption?: string;
  /** Optional chapter/section name. Images sharing the same chapter are grouped. */
  chapter?: string;
}

interface Props {
  images: LightboxImage[];
  startIndex: number;
  onClose: () => void;
  /** Allow direct download of original. Default false (DRM-friendly). */
  allowDownload?: boolean;
  /** Project / collection title shown in top bar. */
  title?: string;
}

const SWIPE_THRESHOLD = 50;
const MAX_ZOOM = 6;
const MIN_ZOOM = 1;
const SLIDESHOW_INTERVAL = 4000;
const DBL_TAP_ZOOM = 2.5;

function resolveUrl(raw: string) {
  const v = raw?.trim() ?? "";
  if (!v) return "";
  if (v.startsWith("http") || v.startsWith("data:") || v.startsWith("blob:")) return v;
  if (v.startsWith("/")) return `${window.location.origin}${v}`;
  return v;
}

export function CinematicLightbox({ images, startIndex, onClose, allowDownload = false, title }: Props) {
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
  const [playing, setPlaying] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef<number>(0);
  const idleTimer = useRef<number | null>(null);

  // Group by chapter for the grid + chapter nav
  const chapters = useMemo(() => {
    const map = new Map<string, number[]>();
    images.forEach((img, i) => {
      const c = img.chapter?.trim() || "";
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(i);
    });
    return Array.from(map.entries()).map(([name, indices]) => ({ name, indices }));
  }, [images]);
  const hasChapters = chapters.length > 1 || (chapters[0]?.name ?? "") !== "";
  const currentChapter = images[idx]?.chapter || "";

  useEffect(() => { setIdx(clampIndex(startIndex)); }, [startIndex, total, clampIndex]);
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [idx]);

  const current = images[idx];
  const currentUrl = useMemo(() => resolveUrl(current?.image_url ?? ""), [current?.image_url]);

  // Preload neighbors
  useEffect(() => {
    if (total <= 1) return;
    [(idx + 1) % total, (idx - 1 + total) % total, (idx + 2) % total].forEach((i) => {
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

  // Slideshow
  useEffect(() => {
    if (!playing || total <= 1) return;
    const t = window.setInterval(() => {
      setDirection(1);
      setIdx((i) => (i + 1) % total);
    }, SLIDESHOW_INTERVAL);
    return () => window.clearInterval(t);
  }, [playing, total]);

  // Lock body scroll
  useEffect(() => {
    const s = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = s; };
  }, []);

  // Auto-hide chrome during slideshow / inactivity
  const wakeChrome = useCallback(() => {
    setChromeVisible(true);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    if (playing) {
      idleTimer.current = window.setTimeout(() => setChromeVisible(false), 2200);
    }
  }, [playing]);
  useEffect(() => { wakeChrome(); }, [idx, playing, wakeChrome]);

  // Fullscreen
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await rootRef.current?.requestFullscreen?.();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    } catch { /* no-op */ }
  }, []);
  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Share
  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: current?.caption || title || "Image", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMsg("Link copied");
      setTimeout(() => setShareMsg(null), 1600);
    } catch { /* cancelled */ }
  }, [current?.caption, title]);

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showGrid) { setShowGrid(false); return; }
        onClose();
      }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "+" || e.key === "=") zoomIn();
      if (e.key === "-") zoomOut();
      if (e.key === "0") resetZoom();
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key.toLowerCase() === "f") toggleFullscreen();
      if (e.key.toLowerCase() === "g") setShowGrid((g) => !g);
      if (e.key.toLowerCase() === "i") setShowInfo((v) => !v);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [next, prev, onClose, zoomIn, zoomOut, resetZoom, toggleFullscreen, showGrid]);

  // Cursor-anchored zoom (wheel)
  const zoomAt = useCallback((clientX: number, clientY: number, factor: number) => {
    const el = stageRef.current;
    if (!el) { setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * factor))); return; }
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setZoom((z) => {
      const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z * factor));
      const ratio = nz / z;
      if (nz <= 1) { setPan({ x: 0, y: 0 }); return nz; }
      setPan((p) => {
        // pivot the zoom around the cursor position relative to stage center
        const ox = clientX - cx - p.x;
        const oy = clientY - cy - p.y;
        return { x: p.x - ox * (ratio - 1), y: p.y - oy * (ratio - 1) };
      });
      return nz;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    zoomAt(e.clientX, e.clientY, factor);
  }, [zoomAt]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoom > 1) { resetZoom(); return; }
    zoomAt(e.clientX, e.clientY, DBL_TAP_ZOOM);
  };

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
  const progressPct = total > 0 ? ((idx + 1) / total) * 100 : 0;

  const content = (
    <div
      ref={rootRef}
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClose}
      onMouseMove={wakeChrome}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(8,8,8,0.97)",
        backdropFilter: "blur(8px)",
        display: "flex", flexDirection: "column",
        height: "100dvh", maxHeight: "100dvh",
        overflow: "hidden",
        touchAction: "none",
        animation: "lbFade 280ms cubic-bezier(0.22,1,0.36,1)",
        cursor: chromeVisible ? "default" : "none",
      }}
    >
      <style>{`
        @keyframes lbFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lbSlideR { from { opacity: 0; transform: translateX(40px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes lbSlideL { from { opacity: 0; transform: translateX(-40px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes lbZoomIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes lbToast { 0% { opacity: 0; transform: translateY(8px); } 15%,85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-8px); } }
        .lb-btn { width: 36px; height: 36px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.06); cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.85); transition: background 200ms ease, transform 200ms ease, opacity 200ms ease; backdrop-filter: blur(10px); }
        .lb-btn:hover { background: rgba(255,255,255,0.18); transform: scale(1.05); }
        .lb-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .lb-btn.active { background: rgba(255,255,255,0.95); color: rgba(0,0,0,0.9); }
        .lb-nav { width: 48px; height: 48px; }
        .lb-chrome { transition: opacity 300ms ease, transform 300ms ease; }
        .lb-chrome.hidden { opacity: 0; pointer-events: none; transform: translateY(-8px); }
        .lb-chrome.bottom.hidden { transform: translateY(8px); }
        .lb-grid-tile { position: relative; overflow: hidden; cursor: pointer; background: rgba(255,255,255,0.03); transition: transform 250ms cubic-bezier(0.22,1,0.36,1); }
        .lb-grid-tile:hover { transform: scale(1.02); }
        .lb-grid-tile img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 600ms cubic-bezier(0.22,1,0.36,1); }
        .lb-grid-tile:hover img { transform: scale(1.06); }
      `}</style>

      {/* Top progress bar */}
      <div className={`lb-chrome ${chromeVisible ? "" : "hidden"}`} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.08)", zIndex: 5 }}>
        <div style={{ width: `${progressPct}%`, height: "100%", background: "rgba(255,255,255,0.85)", transition: "width 380ms cubic-bezier(0.22,1,0.36,1)" }} />
      </div>

      {/* Top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`lb-chrome ${chromeVisible ? "" : "hidden"}`}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px 12px", flexShrink: 0, gap: 12 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
          {title && (
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "system-ui, sans-serif" }}>
              {title}
            </span>
          )}
          <span style={{ color: "rgba(255,255,255,0.95)", fontSize: 13, fontWeight: 500, letterSpacing: "0.05em", fontFamily: "system-ui, sans-serif", fontVariantNumeric: "tabular-nums" }}>
            {String(idx + 1).padStart(2, "0")}
            <span style={{ color: "rgba(255,255,255,0.35)", margin: "0 6px" }}>/</span>
            <span style={{ color: "rgba(255,255,255,0.45)" }}>{String(total).padStart(2, "0")}</span>
            {hasChapters && currentChapter && (
              <span style={{ color: "rgba(255,255,255,0.55)", marginLeft: 12, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                · {currentChapter}
              </span>
            )}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <button className={`lb-btn ${showGrid ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setShowGrid((g) => !g); }} aria-label="Grid view" title="Grid (G)">
            <Grid3X3 size={15} />
          </button>
          {total > 1 && (
            <button className={`lb-btn ${playing ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); }} aria-label="Slideshow" title="Slideshow (Space)">
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
          )}
          <button className={`lb-btn ${showInfo ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setShowInfo((v) => !v); }} aria-label="Toggle caption" title="Caption (I)">
            <Info size={14} />
          </button>
          <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
          <button className="lb-btn" onClick={(e) => { e.stopPropagation(); zoomOut(); }} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out" title="Zoom out (-)">
            <ZoomOut size={15} />
          </button>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, minWidth: 36, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button className="lb-btn" onClick={(e) => { e.stopPropagation(); zoomIn(); }} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in (+)">
            <ZoomIn size={15} />
          </button>
          {zoom !== 1 && (
            <button className="lb-btn" onClick={(e) => { e.stopPropagation(); resetZoom(); }} aria-label="Reset zoom" title="Reset (0)">
              <Maximize2 size={14} />
            </button>
          )}
          <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px" }} />
          <button className="lb-btn" onClick={(e) => { e.stopPropagation(); handleShare(); }} aria-label="Share" title="Share">
            <Share2 size={14} />
          </button>
          {allowDownload && (
            <a className="lb-btn" href={currentUrl} download target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Download" title="Download">
              <Download size={14} />
            </a>
          )}
          <button className="lb-btn" onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} aria-label="Fullscreen" title="Fullscreen (F)">
            {isFullscreen ? <Minimize size={14} /> : <Expand size={14} />}
          </button>
          <button className="lb-btn" onClick={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close" title="Close (Esc)">
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
          cursor: zoom > 1 ? (dragStart.current ? "grabbing" : "grab") : (chromeVisible ? "default" : "none"),
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

            {/* Caption overlay */}
            {showInfo && current.caption && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`lb-chrome ${chromeVisible ? "" : "hidden"}`}
                style={{
                  position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
                  maxWidth: "min(640px, 86vw)",
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(14px)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  padding: "10px 16px",
                  color: "rgba(255,255,255,0.92)", fontSize: 12, lineHeight: 1.55,
                  fontFamily: "system-ui, sans-serif", textAlign: "center",
                }}
              >
                {current.caption}
              </div>
            )}
          </>
        )}
      </div>

      {/* Desktop nav arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className={`lb-btn lb-nav lb-chrome ${chromeVisible ? "" : "hidden"}`}
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", display: "none" }}
            aria-label="Previous"
            data-desktop-nav
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className={`lb-btn lb-nav lb-chrome ${chromeVisible ? "" : "hidden"}`}
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
          className={`lb-chrome bottom ${chromeVisible ? "" : "hidden"}`}
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

      {/* Grid Overlay */}
      {showGrid && (
        <div
          onClick={(e) => { e.stopPropagation(); setShowGrid(false); }}
          style={{
            position: "absolute", inset: 0, zIndex: 10,
            background: "rgba(6,6,6,0.96)", backdropFilter: "blur(20px)",
            overflowY: "auto", padding: "72px 24px 32px",
            animation: "lbZoomIn 280ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 1280, margin: "0 auto" }}>
            {chapters.map((ch) => (
              <div key={ch.name || "default"} style={{ marginBottom: 36 }}>
                {hasChapters && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase" }}>
                      {ch.name || "Untitled"}
                    </span>
                    <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                    <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontVariantNumeric: "tabular-nums" }}>
                      {ch.indices.length}
                    </span>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                  {ch.indices.map((i) => {
                    const im = images[i];
                    return (
                      <div
                        key={`${im.id}-${i}`}
                        className="lb-grid-tile"
                        onClick={() => { setDirection(i > idx ? 1 : -1); setIdx(i); setShowGrid(false); }}
                        style={{
                          aspectRatio: "1 / 1",
                          outline: i === idx ? "2px solid rgba(255,255,255,0.95)" : "none",
                          outlineOffset: -2,
                        }}
                      >
                        <img src={resolveUrl(im.image_url)} alt={im.caption || ""} loading="lazy" draggable={false} />
                        <span style={{
                          position: "absolute", top: 6, left: 6, padding: "2px 6px",
                          background: "rgba(0,0,0,0.55)", color: "rgba(255,255,255,0.85)",
                          fontSize: 10, fontVariantNumeric: "tabular-nums", letterSpacing: "0.08em",
                        }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {shareMsg && (
        <div style={{
          position: "absolute", bottom: 96, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.95)", color: "#0a0a0a",
          padding: "8px 16px", fontSize: 12, letterSpacing: "0.08em",
          animation: "lbToast 1600ms ease forwards", zIndex: 20,
        }}>
          {shareMsg}
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
