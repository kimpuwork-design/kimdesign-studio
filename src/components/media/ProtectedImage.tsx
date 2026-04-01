import { useRef, forwardRef, ImgHTMLAttributes } from "react";

/**
 * ProtectedImage — renders an image with content-protection layers:
 * - Right-click disabled
 * - Dragging disabled
 * - Transparent overlay blocks direct interaction with <img>
 * - CSS user-select / pointer-events protection
 * - Optional watermark overlay
 */
interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, "onContextMenu" | "draggable"> {
  watermark?: string;
  /** forward a ref to the underlying <img> for parallax etc. */
  imgRef?: React.Ref<HTMLImageElement>;
}

const ProtectedImage = forwardRef<HTMLDivElement, Props>(
  ({ watermark, imgRef, className, style, alt, ...imgProps }, containerRef) => {
    const fallbackRef = useRef<HTMLImageElement>(null);

    return (
      <div
        ref={containerRef}
        className="protected-media-container"
        style={{ position: "relative", overflow: "hidden", ...style }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          ref={imgRef || fallbackRef}
          alt={alt}
          draggable={false}
          className={className}
          style={{
            WebkitUserDrag: "none",
            userSelect: "none",
            pointerEvents: "none",
          } as React.CSSProperties}
          {...imgProps}
        />
        {/* Invisible overlay to block direct img interaction */}
        <div
          className="protected-media-shield"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            cursor: "default",
            background: "transparent",
          }}
          onContextMenu={(e) => e.preventDefault()}
        />
        {/* Watermark overlay */}
        {watermark && (
          <div
            className="protected-media-watermark"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              userSelect: "none",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "-50%",
                display: "flex",
                flexWrap: "wrap",
                gap: "60px",
                justifyContent: "center",
                alignContent: "center",
                transform: "rotate(-30deg)",
              }}
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.06)",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {watermark}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ProtectedImage.displayName = "ProtectedImage";
export { ProtectedImage };
