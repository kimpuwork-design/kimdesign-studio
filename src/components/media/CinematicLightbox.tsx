import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { galleryFocusIndex } from "@/lib/gallery-keyboard";
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const gridToggleRef = useRef<HTMLButtonElement>(null);
  const thumbnailRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const gridRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const returnFocusRef = useRef(document.activeElement);

  // Group by chapter for the grid + chapter nav
  const chapters = useMemo(() => {
    const map = new Map<string, number[]>();
    images.forEach((img, i) => {
      const c = img.chapter?.trim() || "";
      if (!map.has(c)) map.set(c, []);
      map.get(c)?.push(i);
    });
    return Array.from(map.entries()).map(([name, indices]) => ({ name, indices }));
  }, [images]);
  const hasChapters = chapters.length > 1 || (chapters[0]?.name ?? "") !== "";
  const currentChapter = images[idx]?.chapter || "";

  useEffect(() => { setIdx(clampIndex(startIndex)); }, [startIndex, total, clampIndex]);
  useEffect(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, [idx]);

  const current = images[idx];
  const currentUrl = useMemo(() => resolveUrl(current?.image_url ?? ""), [current?.image_url]);

  // Preload a window of neighbors and decode them so they're paint-ready
  useEffect(() => {
    if (total <= 1) return;
    const offsets = [1, -1, 2, -2, 3];
    offsets.forEach((off) => {
      const i = ((idx + off) % total + total) % total;
      const u = resolveUrl(images[i]?.image_url ?? "");
      if (!u) return;
      const im = new Image();
      im.decoding = "async";
      im.src = u;
      // Best-effort decode; ignore errors
      im.decode?.().catch(() => {});
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

  // Auto-hide chrome during slideshow / inactivity
  const wakeChrome = useCallback(() => {
    setChromeVisible(true);
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    if (playing) {
      idleTimer.current = window.setTimeout(() => {
        if (!rootRef.current?.contains(document.activeElement)) setChromeVisible(false);
      }, 2200);
    }
  }, [playing]);
  useEffect(() => { wakeChrome(); return () => { if (idleTimer.current) window.clearTimeout(idleTimer.current); }; }, [idx, playing, wakeChrome]);

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

  // Scoped to the dialog; native Enter/Space activation remains intact on controls.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    wakeChrome();
    if (e.defaultPrevented || e.nativeEvent.isComposing || e.altKey || e.ctrlKey || e.metaKey || showGrid) return;
    if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const index = galleryFocusIndex(e.nativeEvent, idx, total);
    if (index !== null) {
      e.preventDefault();
      setDirection(index > idx ? 1 : -1);
      setIdx(index);
      return;
    }
    switch (e.key.toLowerCase()) {
      case "+": case "=": e.preventDefault(); zoomIn(); break;
      case "-": e.preventDefault(); zoomOut(); break;
      case "0": e.preventDefault(); resetZoom(); break;
      case " ":
        if (e.target instanceof Element && e.target.closest('button, a')) return;
        e.preventDefault(); setPlaying((p) => !p); break;
      case "f": e.preventDefault(); toggleFullscreen(); break;
      case "g": e.preventDefault(); setShowGrid((g) => !g); break;
      case "i": e.preventDefault(); setShowInfo((v) => !v); break;
    }
  };

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
    <DialogPrimitive.Content
      ref={rootRef}
      onOpenAutoFocus={(e) => { e.preventDefault(); closeRef.current?.focus(); }}
      onCloseAutoFocus={(e) => { e.preventDefault(); if (returnFocusRef.current instanceof HTMLElement) returnFocusRef.current.focus(); }}
      aria-describedby={undefined}
      onKeyDown={handleKeyDown}
      onFocusCapture={wakeChrome}
      aria-label={title ? `${title} — image viewer` : "Image viewer"}
      tabIndex={-1}
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClose}
      onMouseMove={wakeChrome}
      style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background:
          "radial-gradient(ellipse at 50% 40%, hsl(240 30% 10% / 0.94) 0%, hsl(240 35% 5% / 0.98) 65%, hsl(240 40% 3% / 1) 100%)",
        backdropFilter: "blur(24px) saturate(140%)",
        display: "flex", flexDirection: "column",
        height: "100dvh", maxHeight: "100dvh",
        overflow: "hidden",
        touchAction: "none",
        animation: "lbFade 320ms cubic-bezier(0.22,1,0.36,1)",
        cursor: chromeVisible ? "default" : "none",
      }}
    >
      <DialogPrimitive.Title className="sr-only">{title ? `${title} — image viewer` : "Image viewer"}</DialogPrimitive.Title>
      <style>{`
        @keyframes lbFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lbSlideR { from { opacity: 0; transform: translateX(40px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes lbSlideL { from { opacity: 0; transform: translateX(-40px) scale(0.98); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes lbZoomIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
        @keyframes lbToast { 0% { opacity: 0; transform: translateY(8px); } 15%,85% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-8px); } }
        .lb-btn { width: 44px; height: 44px; padding: 0; flex-shrink: 0; border-radius: 999px; background: linear-gradient(135deg, hsl(0 0% 100% / 0.14), hsl(0 0% 100% / 0.05)); border: 1px solid hsl(0 0% 100% / 0.14); box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.18), 0 8px 24px -12px hsl(0 0% 0% / 0.6); cursor: pointer; display: flex; align-items: center; justify-content: center; color: hsl(0 0% 100% / 0.9); transition: background 220ms ease, color 220ms ease, transform 220ms cubic-bezier(0.22,1,0.36,1), box-shadow 220ms ease; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); }
        .lb-btn:hover { background: linear-gradient(135deg, hsl(0 0% 100% / 0.24), hsl(0 0% 100% / 0.1)); transform: translateY(-1px); }
        .lb-btn:active { transform: scale(0.95); }
        .lb-btn:focus-visible, .lb-thumb:focus-visible, .lb-grid-tile:focus-visible { outline: 3px solid hsl(var(--hero-foreground)); outline-offset: 3px; box-shadow: 0 0 0 6px hsl(var(--hero)); }
        .lb-grid-tile:focus-visible { z-index: 1; }
        @media (max-width: 639px) { .lb-pill { gap: 0; padding: 2px; } }
        .lb-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }
        .lb-btn.active { background: hsl(0 0% 100% / 0.92); color: hsl(240 30% 8%); border-color: hsl(0 0% 100%); }
        .lb-pill { display: flex; align-items: center; gap: 4px; padding: 4px; border-radius: 999px; background: hsl(0 0% 100% / 0.06); border: 1px solid hsl(0 0% 100% / 0.1); backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); }
        .lb-pill .lb-btn { width: 44px; height: 44px; background: transparent; border-color: transparent; box-shadow: none; }
        .lb-pill .lb-btn:hover { background: hsl(0 0% 100% / 0.14); }
        .lb-pill .lb-btn.active { background: hsl(0 0% 100% / 0.92); }
        @media (max-width: 639px) { .lb-hide-sm { display: none !important; } }
        .lb-nav { width: 52px; height: 52px; border-radius: 999px; }
        .lb-chrome { transition: opacity 320ms ease, transform 320ms ease; }
        .lb-chrome.hidden { opacity: 0; pointer-events: none; transform: translateY(-8px); }
        .lb-chrome.bottom.hidden { transform: translateY(8px); }
        .lb-grid-tile { position: relative; overflow: hidden; cursor: pointer; background: hsl(0 0% 100% / 0.05); border: 1px solid hsl(0 0% 100% / 0.08); border-radius: 16px; transition: transform 280ms cubic-bezier(0.22,1,0.36,1), border-color 280ms ease, box-shadow 280ms ease; }
        .lb-grid-tile:hover { transform: scale(1.03); border-color: hsl(0 0% 100% / 0.5); box-shadow: 0 16px 40px -14px hsl(0 0% 0% / 0.8); }
        .lb-grid-tile img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 700ms cubic-bezier(0.22,1,0.36,1); }
        .lb-grid-tile:hover img { transform: scale(1.06); }
      `}</style>

      {/* Screen-reader live region — announces current image on navigation. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}
      >
        {total > 0 ? `Image ${idx + 1} of ${total}${current?.caption ? `: ${current.caption}` : ""}` : ""}
      </div>

      {/* Top progress bar — gold */}
      <div className={`lb-chrome ${chromeVisible ? "" : "hidden"}`} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "hsl(218 50% 14% / 0.6)", zIndex: 5 }}>
        <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, hsl(0 0% 100% / 0.6), hsl(0 0% 100%))", boxShadow: "0 0 12px hsl(0 0% 100% / 0.4)", transition: "width 420ms cubic-bezier(0.22,1,0.36,1)" }} />
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
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <div className="lb-pill">
          <Button variant="ghost" className={`lb-btn ${showGrid ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setShowGrid((g) => !g); }} ref={gridToggleRef} aria-pressed={showGrid} aria-label="Grid view" title="Grid (G)">
            <Grid3X3 size={15} />
          </Button>
          {total > 1 && (
            <Button variant="ghost" className={`lb-btn ${playing ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setPlaying((p) => !p); }} aria-pressed={playing} aria-label={playing ? "Pause slideshow" : "Start slideshow"} title="Slideshow (Space)">
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </Button>
          )}
          <Button variant="ghost" className={`lb-btn ${showInfo ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); setShowInfo((v) => !v); }} aria-pressed={showInfo} aria-label="Toggle caption" title="Caption (I)">
            <Info size={14} />
          </Button>
          </div>
          <div className="lb-pill lb-hide-sm">
          <Button variant="ghost" className="lb-btn" onClick={(e) => { e.stopPropagation(); zoomOut(); }} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out" title="Zoom out (-)">
            <ZoomOut size={15} />
          </Button>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, minWidth: 36, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" className="lb-btn" onClick={(e) => { e.stopPropagation(); zoomIn(); }} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in (+)">
            <ZoomIn size={15} />
          </Button>
          {zoom !== 1 && (
            <Button variant="ghost" className="lb-btn" onClick={(e) => { e.stopPropagation(); resetZoom(); }} aria-label="Reset zoom" title="Reset (0)">
              <Maximize2 size={14} />
            </Button>
          )}
          </div>
          <div className="lb-pill">
          <Button variant="ghost" className="lb-btn" onClick={(e) => { e.stopPropagation(); handleShare(); }} aria-label="Share" title="Share">
            <Share2 size={14} />
          </Button>
          {allowDownload && (
            <a className="lb-btn" href={currentUrl} download target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Download" title="Download">
              <Download size={14} />
            </a>
          )}
          <Button variant="ghost" className="lb-btn lb-hide-sm" onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} aria-pressed={isFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} title="Fullscreen (F)">
            {isFullscreen ? <Minimize size={14} /> : <Expand size={14} />}
          </Button>
          </div>
          <Button variant="ghost" className="lb-btn" onClick={(e) => { e.stopPropagation(); onClose(); }} ref={closeRef} aria-label="Close image viewer" title="Close (Esc)">
            <X size={15} />
          </Button>
        </div>
      </div>

      {/* Image area */}
      <div
        ref={stageRef}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={handleDoubleClick}
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
              <>
                {/* Blurred stand-in from the (usually cached) same URL while the full image decodes */}
                <img
                  src={currentUrl}
                  alt=""
                  aria-hidden="true"
                  draggable={false}
                  style={{
                    position: "absolute", maxWidth: "92vw", maxHeight: "78vh", objectFit: "contain",
                    filter: "blur(24px) saturate(1.2)", opacity: 0.55, transform: "scale(1.02)",
                    borderRadius: 18, pointerEvents: "none",
                  }}
                />
                <div style={{ position: "absolute" }}>
                  <div style={{
                    width: 28, height: 28, border: "2px solid rgba(255,255,255,0.15)",
                    borderTopColor: "rgba(255,255,255,0.8)", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              </>
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
                ref={(el) => {
                  // Cached images may finish before React attaches onLoad
                  if (el?.complete && el.naturalWidth > 0 && !loaded.has(current.id)) {
                    setLoaded((p) => new Set(p).add(current.id));
                  }
                }}
                onLoad={() => setLoaded((p) => new Set(p).add(current.id))}
                onError={() => setErrorIds((p) => new Set(p).add(current.id))}
                style={{
                  display: "block", maxWidth: "92vw", maxHeight: "78vh",
                  objectFit: "contain", userSelect: "none",
                  WebkitUserDrag: "none", pointerEvents: "none",
                  borderRadius: zoom > 1 ? 0 : 14,
                  boxShadow: "0 40px 100px -30px hsl(0 0% 0% / 0.8)",
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
                  maxWidth: "min(680px, 88vw)",
                  background: "linear-gradient(135deg, hsl(0 0% 100% / 0.12), hsl(0 0% 100% / 0.04))",
                  backdropFilter: "blur(18px) saturate(1.3)",
                  border: "1px solid hsl(0 0% 100% / 0.14)",
                  borderRadius: 999,
                  padding: "12px 20px",
                  color: "hsl(0 0% 100% / 0.95)", fontSize: 12.5, lineHeight: 1.6,
                  fontFamily: "system-ui, sans-serif", textAlign: "center",
                  boxShadow: "0 12px 40px -12px hsl(218 80% 2% / 0.6), inset 0 1px 0 hsl(0 0% 100% / 0.15)",
                  letterSpacing: "0.01em",
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
          <Button variant="ghost"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className={`lb-btn lb-nav lb-chrome ${chromeVisible ? "" : "hidden"}`}
            style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", display: "none" }}
            aria-label="Previous image"
            data-desktop-nav
          >
            <ChevronLeft size={20} />
          </Button>
          <Button variant="ghost"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className={`lb-btn lb-nav lb-chrome ${chromeVisible ? "" : "hidden"}`}
            style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", display: "none" }}
            aria-label="Next image"
            data-desktop-nav
          >
            <ChevronRight size={20} />
          </Button>
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
            display: "flex", justifyContent: "flex-start",
            overflowX: "auto", gap: 6,
            scrollbarWidth: "none",
          }}
        >
          {images.map((img, i) => (
            <Button variant="ghost"
              key={`${img.id}-${i}`}
              className="lb-thumb"
              ref={(el) => { thumbnailRefs.current[i] = el; }}
              aria-label={`View image ${i + 1} of ${total}${img.caption ? `: ${img.caption}` : ""}`}
              aria-pressed={i === idx}
              tabIndex={i === idx ? 0 : -1}
              onKeyDown={(e) => {
                const nextIndex = galleryFocusIndex(e.nativeEvent, i, total);
                if (nextIndex === null) return;
                e.preventDefault(); e.stopPropagation();
                setDirection(nextIndex > idx ? 1 : -1); setIdx(nextIndex);
                thumbnailRefs.current[nextIndex]?.focus();
                thumbnailRefs.current[nextIndex]?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
              }}
              onClick={() => { setDirection(i > idx ? 1 : -1); setIdx(i); }}
              style={{
                flexShrink: 0,
                width: 52,
                height: 52,
                overflow: "hidden",
                borderRadius: 12,
                border: i === idx ? "2px solid hsl(0 0% 100% / 0.95)" : "1px solid hsl(0 0% 100% / 0.12)",
                opacity: i === idx ? 1 : 0.5,
                cursor: "pointer",
                padding: 0,
                background: "transparent",
                boxShadow: i === idx ? "0 8px 24px -8px hsl(0 0% 0% / 0.8)" : "none",
                transition: "all 280ms cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <img
                src={resolveUrl(img.image_url)}
                alt=""
                draggable={false}
                loading="lazy"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Button>
          ))}
        </div>
      )}

      {/* Grid Overlay */}
      {showGrid && (
        <DialogPrimitive.Root open={showGrid} onOpenChange={setShowGrid}>
        <DialogPrimitive.Portal container={rootRef.current}>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => { e.preventDefault(); gridRefs.current[idx]?.focus(); }}
          onCloseAutoFocus={(e) => { e.preventDefault(); gridToggleRef.current?.focus(); }}
          onClick={(e) => { e.stopPropagation(); setShowGrid(false); }}
          style={{
            position: "absolute", inset: 0, zIndex: 10,
            background: "hsl(240 35% 5% / 0.9)", backdropFilter: "blur(30px) saturate(160%)",
            overflowY: "auto", padding: "72px 24px 32px",
            animation: "lbZoomIn 280ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <DialogPrimitive.Title className="sr-only">Choose a gallery image</DialogPrimitive.Title>
          <Button variant="ghost" className="lb-btn absolute right-4 top-4" aria-label="Close grid view" onClick={(e) => { e.stopPropagation(); setShowGrid(false); }}><X aria-hidden size={18} /></Button>
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
                      <Button variant="ghost"
                        key={`${im.id}-${i}`}
                        ref={(el) => { gridRefs.current[i] = el; }}
                        aria-label={`View image ${i + 1} of ${total}${im.caption ? `: ${im.caption}` : ""}`}
                        aria-pressed={i === idx}
                        onKeyDown={(e) => {
                          const nextIndex = galleryFocusIndex(e.nativeEvent, i, total);
                          if (nextIndex === null) return;
                          e.preventDefault(); e.stopPropagation(); gridRefs.current[nextIndex]?.focus();
                        }}
                        className="lb-grid-tile"
                        onClick={() => { setDirection(i > idx ? 1 : -1); setIdx(i); setShowGrid(false); }}
                        style={{
                          aspectRatio: "1 / 1", height: "auto", padding: 0,
                          borderWidth: i === idx ? 2 : 1,
                        }}
                      >
                        <img src={resolveUrl(im.image_url)} alt={im.caption || ""} loading="lazy" draggable={false} />
                        <span style={{
                          position: "absolute", top: 6, left: 6, padding: "2px 6px",
                          background: "rgba(0,0,0,0.5)", color: "rgba(255,255,255,0.9)", borderRadius: 999, backdropFilter: "blur(8px)",
                          fontSize: 10, fontVariantNumeric: "tabular-nums", letterSpacing: "0.08em",
                        }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      )}

      {/* Toast */}
      {shareMsg && (
        <div role="status" style={{
          position: "absolute", bottom: 96, left: "50%", transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.95)", color: "#0a0a0a",
          padding: "8px 18px", fontSize: 12, letterSpacing: "0.08em", borderRadius: 999,
          animation: "lbToast 1600ms ease forwards", zIndex: 20,
        }}>
          {shareMsg}
        </div>
      )}
    </DialogPrimitive.Content>
  );

  return <DialogPrimitive.Root open onOpenChange={(open) => { if (!open) onClose(); }}><DialogPrimitive.Portal>{content}</DialogPrimitive.Portal></DialogPrimitive.Root>;
}
