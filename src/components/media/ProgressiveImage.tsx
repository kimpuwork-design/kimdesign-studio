import { useEffect, useRef, useState } from "react";

interface Props extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "onLoad"> {
  src: string;
  alt: string;
  /** Force eager load (above-the-fold). Default false. */
  eager?: boolean;
  /** Set high fetch priority (LCP). Default false. */
  priority?: boolean;
  /** Tailwind/aspect wrapper class. */
  wrapperClassName?: string;
  /** Object-fit on the <img>. Default "cover". */
  fit?: "cover" | "contain";
  onReady?: () => void;
}

/**
 * Progressive image with shimmer placeholder + decode-then-fade-in.
 * Uses `img.decode()` so the bitmap is fully ready before we show it,
 * which eliminates the half-painted flash on large hero images.
 */
export function ProgressiveImage({
  src,
  alt,
  eager = false,
  priority = false,
  wrapperClassName = "",
  fit = "cover",
  className = "",
  onReady,
  ...rest
}: Props) {
  const [ready, setReady] = useState(false);
  const [errored, setErrored] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setReady(false);
    setErrored(false);
    if (!src) return;
    let cancelled = false;
    const probe = new Image();
    probe.decoding = "async";
    probe.src = src;
    const finish = () => {
      if (cancelled) return;
      setReady(true);
      onReady?.();
    };
    // Prefer decode() when available so the bitmap is paint-ready.
    (probe.decode ? probe.decode().then(finish, finish) : Promise.resolve().then(() => {
      probe.onload = finish;
      probe.onerror = () => { if (!cancelled) { setErrored(true); } };
    }));
    return () => { cancelled = true; };
  }, [src, onReady]);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Shimmer placeholder — navy/gold tinted */}
      {!ready && !errored && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(110deg, hsl(218 30% 92%) 8%, hsl(43 40% 90%) 18%, hsl(218 30% 92%) 33%)",
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
      {src && !errored && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          {...(priority ? ({ fetchpriority: "high" } as Record<string, string>) : {})}
          {...rest}
          className={`size-full ${fit === "cover" ? "object-cover" : "object-contain"} transition-opacity duration-700 ease-out ${ready ? "opacity-100" : "opacity-0"} ${className}`}
          style={{
            userSelect: "none",
            WebkitUserDrag: "none",
            ...(rest.style || {}),
          } as React.CSSProperties}
        />
      )}
    </div>
  );
}
