import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { thumbUrl } from "@/lib/images";
import { useAccessibility } from "@/contexts/AccessibilityContext";

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "onLoad" | "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  src: string;
  alt: string;
  /** Force eager load (above-the-fold). Default false. */
  eager?: boolean;
  /** Set high fetch priority (LCP). Default false. */
  priority?: boolean;
  /** Tailwind/aspect wrapper class. */
  wrapperClassName?: string;
  /**
   * Aspect-ratio for the wrapper, e.g. "16 / 9", "4 / 3", "1 / 1".
   * Reserves layout space BEFORE the image loads, eliminating CLS.
   * Skip only when the parent already enforces a height/aspect.
   */
  aspectRatio?: string;
  /** Object-fit on the <img>. Default "cover". */
  fit?: "cover" | "contain";
  /**
   * If set, request a resized variant from Supabase storage
   * (`?width=X&quality=75`). No-op for non-Supabase URLs.
   */
  thumbWidth?: number;
  onReady?: () => void;
  /** motion props */
  animate?: any;
  transition?: any;
}

/**
 * Progressive image with a persistent skeleton (correct aspect-ratio) + decode-then-fade-in.
 *
 * Layout-safe: the wrapper reserves space via `aspect-ratio` so the skeleton
 * and the eventual <img> occupy identical boxes — no layout shift on load.
 *
 * The skeleton stays mounted UNDER the image while it fades in (so the empty
 * box never flashes), then unmounts after the fade transition completes.
 */
export function ProgressiveImage({
  src,
  alt,
  eager = false,
  priority = false,
  wrapperClassName = "",
  aspectRatio,
  fit = "cover",
  thumbWidth,
  className = "",
  onReady,
  animate,
  transition,
  ...rest
}: Props) {
  const { reduceMotion } = useAccessibility();
  const resolvedSrc = thumbWidth ? thumbUrl(src, { width: thumbWidth }) : src;
  const [decoded, setDecoded] = useState(false);
  const [skeletonMounted, setSkeletonMounted] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setDecoded(false);
    setSkeletonMounted(true);
    setErrored(false);
    if (!resolvedSrc) return;
    let cancelled = false;
    const probe = new Image();
    probe.decoding = "async";
    probe.src = resolvedSrc;
    const finish = () => {
      if (!cancelled) {
        setDecoded(true);
        onReady?.();
      }
    };
    const fail = () => { if (!cancelled) setErrored(true); };
    if (probe.decode) {
      probe.decode().then(finish, () => {
        // decode() can reject for valid-but-unsupported scenarios; fall back to onload.
        probe.onload = finish;
        probe.onerror = fail;
      });
    } else {
      probe.onload = finish;
      probe.onerror = fail;
    }
    return () => { cancelled = true; };
  }, [resolvedSrc, onReady]);

  const wrapperStyle: React.CSSProperties = aspectRatio
    ? { aspectRatio }
    : {};

  return (
    <div
      className={`relative overflow-hidden bg-muted/40 ${wrapperClassName}`}
      style={wrapperStyle}
    >
      {/* Persistent skeleton — sits BEHIND the image so the fade-in
          reveals the bitmap on top of the shimmer (no empty flash). */}
      <AnimatePresence>
        {skeletonMounted && !errored && (
          <motion.div
            key="skeleton"
            data-skeleton="true"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-0"
            style={{
              background:
                "linear-gradient(110deg, rgba(255,255,255,0.03) 8%, rgba(255,255,255,0.06) 18%, rgba(255,255,255,0.03) 33%)",
              backgroundSize: "200% 100%",
              animation: "progressiveShimmer 2s linear infinite",
            }}
          />
        )}
      </AnimatePresence>
      <style>{`
        @keyframes progressiveShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          <span>Image unavailable</span>
        </div>
      ) : resolvedSrc ? (
        <motion.img
          src={resolvedSrc}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          {...(priority ? ({ fetchpriority: "high" } as Record<string, string>) : {})}
          {...rest}
          animate={animate}
          transition={transition}
          onLoad={() => {
            if (decoded) {
              setSkeletonMounted(false);
            }
          }}
          className={`relative size-full z-10 ${fit === "cover" ? "object-cover" : "object-contain"} transition-all duration-[800ms] ${
            decoded ? "opacity-100 blur-0 scale-100" : `opacity-0 ${reduceMotion ? "" : "blur-md scale-[1.01]"}`
          } ${className}`}
          style={{
            userSelect: "none",
            WebkitUserDrag: "none",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
            willChange: "opacity, filter, transform",
            ...(rest.style || {}),
          } as React.CSSProperties}
        />
      ) : null}
    </div>
  );
}
