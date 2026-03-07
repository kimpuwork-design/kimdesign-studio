import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Maximize2, Minimize2, Download,
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

export function CinematicLightbox({ images, startIndex, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [showThumbs, setShowThumbs] = useState(true);
  const [showUI, setShowUI] = useState(true);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const imgContainerRef = useRef<HTMLDivElement>(null);

  const current = images[idx];
  const total = images.length;

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback((i: number) => {
    resetView();
    setIdx(i);
  }, [resetView]);

  const prev = useCallback(() => goTo((idx - 1 + total) % total), [idx, total, goTo]);
  const next = useCallback(() => goTo((idx + 1) % total), [idx, total, goTo]);

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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onClose, zoom, resetView]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Touch swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1) return;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex flex-col bg-black select-none"
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
        className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-auto"
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
        </div>
        <div className="flex items-center gap-1">
          <ToolButton icon={zoom > 1 ? ZoomOut : ZoomIn} label={zoom > 1 ? "Reset zoom" : "Zoom in"}
            onClick={() => { if (zoom > 1) resetView(); else setZoom(2); }} />
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
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={current.id + idx}
            src={current.image_url}
            alt={current.caption || `Image ${idx + 1}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: zoom,
              x: pan.x,
              y: pan.y,
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              opacity: { duration: 0.25 },
              scale: { type: "spring", stiffness: 300, damping: 30 },
              x: { type: "tween", duration: 0 },
              y: { type: "tween", duration: 0 },
            }}
            className="max-h-[85vh] max-w-[92vw] object-contain rounded-sm pointer-events-none"
            draggable={false}
          />
        </AnimatePresence>
      </div>

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

      {/* Thumbnail strip */}
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
                onClick={() => goTo(i)}
                className={`
                  shrink-0 rounded-lg overflow-hidden transition-all duration-200 border-2
                  ${i === idx
                    ? "border-white w-16 h-16 sm:w-[72px] sm:h-[72px] ring-2 ring-white/30 scale-105"
                    : "border-transparent w-14 h-14 sm:w-16 sm:h-16 opacity-50 hover:opacity-80 hover:border-white/30"
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
            className="absolute bottom-24 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-white/80 text-xs font-medium tabular-nums"
          >
            {Math.round(zoom * 100)}%
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {total > 1 && (
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.06]">
          <motion.div
            className="h-full bg-white/40"
            initial={false}
            animate={{ width: `${((idx + 1) / total) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      )}
    </motion.div>
  );
}

function ToolButton({
  icon: Icon, label, onClick, className = "",
}: {
  icon: React.ElementType; label: string; onClick: () => void; className?: string;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      className={`w-9 h-9 rounded-full bg-white/[0.06] backdrop-blur-sm flex items-center justify-center text-white/70 hover:bg-white/[0.15] hover:text-white transition-all active:scale-90 ${className}`}
    >
      <Icon size={16} />
    </button>
  );
}
