import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Download, Play, Pause, Info,
} from "lucide-react";

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
const SLIDESHOW_INTERVAL = 4000;

export function CinematicLightbox({ images, startIndex, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [showThumbs, setShowThumbs] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [direction, setDirection] = useState(0); // -1 left, 1 right
  const [isPlaying, setIsPlaying] = useState(false);
  const [imgLoaded, setImgLoaded] = useState<Record<string, boolean>>({});
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const slideshowTimer = useRef<ReturnType<typeof setTimeout>>();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const current = images[idx];
  const total = images.length;

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback((i: number, dir: number) => {
    resetView();
    setDirection(dir);
    setIdx(i);
  }, [resetView]);

  const prev = useCallback(() => goTo((idx - 1 + total) % total, -1), [idx, total, goTo]);
  const next = useCallback(() => goTo((idx + 1) % total, 1), [idx, total, goTo]);

  // Preload adjacent images
  useEffect(() => {
    const preload = (i: number) => {
      const img = images[i];
      if (img && !imgLoaded[img.id]) {
        const el = new Image();
        el.src = img.image_url;
        el.onload = () => setImgLoaded(prev => ({ ...prev, [img.id]: true }));
      }
    };
    preload((idx + 1) % total);
    preload((idx - 1 + total) % total);
    // Preload 2 ahead
    if (total > 3) preload((idx + 2) % total);
  }, [idx, total, images, imgLoaded]);

  // Slideshow autoplay
  useEffect(() => {
    if (isPlaying) {
      slideshowTimer.current = setTimeout(() => next(), SLIDESHOW_INTERVAL);
    }
    return () => { if (slideshowTimer.current) clearTimeout(slideshowTimer.current); };
  }, [isPlaying, idx, next]);

  // Auto-hide UI
  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowUI(true);
    hideTimer.current = setTimeout(() => setShowUI(false), 3500);
  }, []);

  useEffect(() => {
    scheduleHide();
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [idx, scheduleHide]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (zoom > 1) resetView(); else onClose(); }
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.5, 4));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.5, 1));
      if (e.key === "0") resetView();
      if (e.key === " ") { e.preventDefault(); setIsPlaying(p => !p); }
      if (e.key === "i" || e.key === "I") setShowInfo(p => !p);
      if (e.key === "f" || e.key === "F") setShowThumbs(v => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onClose, zoom, resetView]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Touch swipe + double-tap zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Double-tap zoom
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (zoom > 1) resetView(); else setZoom(2.5);
      lastTap.current = 0;
      touchStart.current = null;
      return;
    }
    lastTap.current = now;

    if (!touchStart.current || zoom > 1) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      dx < 0 ? next() : prev();
    }
    touchStart.current = null;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => {
      const nz = z + (e.deltaY > 0 ? -0.25 : 0.25);
      if (nz <= 1) { setPan({ x: 0, y: 0 }); return 1; }
      return Math.min(nz, 4);
    });
  };

  // Double-click zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoom > 1) {
      resetView();
    } else {
      setZoom(2.5);
    }
  };

  // Pan when zoomed
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    scheduleHide();
    if (!isDragging.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => { isDragging.current = false; };

  // Scroll active thumb into view
  useEffect(() => {
    const el = thumbsRef.current?.children[idx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [idx]);

  const handleDownload = async () => {
    const a = document.createElement("a");
    a.href = current.image_url;
    a.download = `image-${idx + 1}`;
    a.target = "_blank";
    a.click();
  };

  // Slide animation variants
  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.92,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.92,
    }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm select-none"
      onMouseMove={scheduleHide}
      onClick={(e) => {
        if (e.target === imgContainerRef.current) {
          if (zoom > 1) resetView();
          else onClose();
        }
      }}
    >
      {/* Top bar */}
      <motion.div
        initial={false}
        animate={{ opacity: showUI ? 1 : 0, y: showUI ? 0 : -20 }}
        transition={{ duration: 0.3 }}
        className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto"
      >
        <div className="flex items-center gap-3">
          <span className="text-white/90 text-sm font-medium tabular-nums">
            {idx + 1} <span className="text-white/40">/ {total}</span>
          </span>
          {current.caption && (
            <span className="text-white/60 text-sm hidden sm:inline truncate max-w-[300px]">
              — {current.caption}
            </span>
          )}
          {/* Slideshow indicator */}
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/10 text-white/70 text-[10px] font-medium"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Auto
            </motion.div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {total > 1 && (
            <ToolButton
              icon={isPlaying ? Pause : Play}
              label={isPlaying ? "Pause slideshow" : "Play slideshow"}
              onClick={() => setIsPlaying(p => !p)}
            />
          )}
          <ToolButton icon={zoom > 1 ? ZoomOut : ZoomIn} label={zoom > 1 ? "Reset zoom" : "Zoom in"}
            onClick={() => { if (zoom > 1) resetView(); else setZoom(2); }} />
          <ToolButton icon={Info} label="Image info"
            onClick={() => setShowInfo(p => !p)}
            active={showInfo} />
          <ToolButton icon={showThumbs ? Minimize2 : Maximize2}
            label={showThumbs ? "Hide thumbnails" : "Show thumbnails"}
            onClick={() => setShowThumbs((v) => !v)} />
          <ToolButton icon={Download} label="Download" onClick={handleDownload} />
          <ToolButton icon={X} label="Close" onClick={onClose} className="ml-1" />
        </div>
      </motion.div>

      {/* Main image area */}
      <div
        ref={imgContainerRef}
        className="flex-1 flex items-center justify-center overflow-hidden cursor-default"
        style={{ cursor: zoom > 1 ? "grab" : "default" }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current.id + idx}
            custom={direction}
            variants={zoom <= 1 ? slideVariants : undefined}
            initial={zoom <= 1 ? "enter" : false}
            animate={zoom <= 1 ? "center" : {
              scale: zoom,
              x: pan.x,
              y: pan.y,
            }}
            exit={zoom <= 1 ? "exit" : { opacity: 0 }}
            transition={{
              x: zoom > 1 ? { type: "tween", duration: 0 } : { type: "spring", stiffness: 300, damping: 30 },
              y: zoom > 1 ? { type: "tween", duration: 0 } : undefined,
              opacity: { duration: 0.2 },
              scale: { type: "spring", stiffness: 300, damping: 30 },
            }}
            className="flex items-center justify-center"
          >
            <img
              src={current.image_url}
              alt={current.caption || `Image ${idx + 1}`}
              onLoad={() => setImgLoaded(prev => ({ ...prev, [current.id]: true }))}
              className="max-h-[80vh] max-w-[90vw] w-auto h-auto object-contain rounded-lg shadow-2xl pointer-events-none"
              draggable={false}
              style={{ display: "block" }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Loading spinner for current image */}
        {!imgLoaded[current.id] && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-4 top-16 bottom-24 w-72 z-20 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/[0.08] p-5 overflow-y-auto flex flex-col gap-4"
          >
            <h3 className="text-white/90 font-semibold text-sm tracking-wide uppercase">Image Details</h3>
            <div className="space-y-3">
              <InfoRow label="Index" value={`${idx + 1} of ${total}`} />
              {current.caption && <InfoRow label="Caption" value={current.caption} />}
              <InfoRow label="Zoom" value={`${Math.round(zoom * 100)}%`} />
              <InfoRow label="Status" value={imgLoaded[current.id] ? "Loaded" : "Loading…"} />
            </div>

            {/* Mini map when zoomed */}
            {zoom > 1 && (
              <div className="mt-auto">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2">Position</p>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 bg-white/5">
                  <img src={current.image_url} alt="" className="w-full h-full object-contain opacity-40" />
                  <motion.div
                    className="absolute border-2 border-white/60 rounded-sm bg-white/10"
                    style={{
                      width: `${(1 / zoom) * 100}%`,
                      height: `${(1 / zoom) * 100}%`,
                    }}
                    animate={{
                      left: `${50 - (pan.x / (zoom * 4)) - (1 / zoom) * 50}%`,
                      top: `${50 - (pan.y / (zoom * 4)) - (1 / zoom) * 50}%`,
                    }}
                    transition={{ type: "tween", duration: 0.05 }}
                  />
                </div>
              </div>
            )}

            <div className="mt-2 pt-3 border-t border-white/[0.06]">
              <p className="text-white/30 text-[10px] leading-relaxed">
                Shortcuts: ←→ navigate · Space slideshow · +/- zoom · 0 reset · I info · F filmstrip · Esc close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav arrows */}
      {total > 1 && (
        <motion.div
          initial={false}
          animate={{ opacity: showUI ? 1 : 0 }}
          className="absolute inset-y-0 inset-x-0 flex items-center justify-between pointer-events-none px-2 sm:px-4"
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.08] flex items-center justify-center text-white/80 hover:bg-white/[0.15] hover:text-white transition-all active:scale-90"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/[0.08] flex items-center justify-center text-white/80 hover:bg-white/[0.15] hover:text-white transition-all active:scale-90"
          >
            <ChevronRight size={22} />
          </button>
        </motion.div>
      )}

      {/* Thumbnail strip / filmstrip */}
      {total > 1 && (
        <motion.div
          initial={false}
          animate={{
            opacity: showUI && showThumbs ? 1 : 0,
            y: showUI && showThumbs ? 0 : 40,
          }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-4 px-4"
        >
          <div
            ref={thumbsRef}
            className="flex gap-2 overflow-x-auto scrollbar-hide justify-center max-w-full mx-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {images.map((img, i) => (
              <button
                key={img.id + i}
                onClick={() => goTo(i, i > idx ? 1 : -1)}
                className={`
                  shrink-0 rounded-lg overflow-hidden transition-all duration-300 border-2 relative
                  ${i === idx
                    ? "border-white w-16 h-16 sm:w-[72px] sm:h-[72px] ring-2 ring-white/30 scale-110"
                    : "border-transparent w-14 h-14 sm:w-16 sm:h-16 opacity-40 hover:opacity-80 hover:border-white/30 hover:scale-105"
                  }
                `}
              >
                <img
                  src={img.image_url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
                {/* Active indicator glow */}
                {i === idx && (
                  <motion.div
                    layoutId="thumb-glow"
                    className="absolute inset-0 rounded-lg ring-2 ring-white/40 pointer-events-none"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Zoom indicator */}
      <AnimatePresence>
        {zoom > 1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 text-xs font-medium tabular-nums flex items-center gap-2"
          >
            <ZoomIn size={12} className="text-white/50" />
            {Math.round(zoom * 100)}%
            <span className="text-white/30 text-[10px]">double-click to reset</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slideshow progress bar */}
      {total > 1 && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.06]">
          <motion.div
            className="h-full bg-white/40"
            initial={false}
            animate={{ width: `${((idx + 1) / total) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          {/* Animated slideshow countdown */}
          {isPlaying && (
            <motion.div
              key={`slideshow-${idx}`}
              className="absolute top-0 left-0 h-full bg-white/30"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: SLIDESHOW_INTERVAL / 1000, ease: "linear" }}
            />
          )}
        </div>
      )}
    </motion.div>
  );
}

function ToolButton({
  icon: Icon, label, onClick, className = "", active = false,
}: {
  icon: React.ElementType; label: string; onClick: () => void; className?: string; active?: boolean;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center transition-all active:scale-90 ${
        active
          ? "bg-white/20 text-white ring-1 ring-white/20"
          : "bg-white/[0.06] text-white/70 hover:bg-white/[0.15] hover:text-white"
      } ${className}`}
    >
      <Icon size={16} />
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/30 text-[10px] uppercase tracking-widest">{label}</p>
      <p className="text-white/80 text-sm mt-0.5">{value}</p>
    </div>
  );
}
