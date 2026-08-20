import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { thumbUrl } from "@/lib/images";

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
      {skeletonMounted && !errored && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, hsl(218 30% 92%) 8%, hsl(43 45% 90%) 18%, hsl(218 30% 92%) 33%)",
            backgroundSize: "200% 100%",
            animation: "progressiveShimmer 1.6s linear infinite",
          }}
        />
      )}
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
          onTransitionEnd={(e) => {
            // Unmount skeleton only after opacity transition lands at 1.
            if (e.propertyName === "opacity" && decoded) {
              setSkeletonMounted(false);
            }
            rest.onTransitionEnd?.(e);
          }}
          className={`relative size-full ${fit === "cover" ? "object-cover" : "object-contain"} transition-opacity duration-700 ease-out ${decoded ? "opacity-100" : "opacity-0"} ${className}`}
          style={{
            userSelect: "none",
            WebkitUserDrag: "none",
            ...(rest.style || {}),
          } as React.CSSProperties}
        />
      ) : null}
    </div>
  );
}
