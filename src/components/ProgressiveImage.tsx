import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
}

export function ProgressiveImage({ src, alt, className = "", aspectRatio }: ProgressiveImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.unobserve(el); } },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative overflow-hidden ${aspectRatio ?? ""}`}>
      {/* Shimmer placeholder */}
      <motion.div
        className="absolute inset-0 shimmer"
        animate={{ opacity: loaded ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      />
      {inView && (
        <motion.img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          initial={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          animate={{
            opacity: loaded ? 1 : 0,
            scale: loaded ? 1 : 1.05,
            filter: loaded ? "blur(0px)" : "blur(10px)",
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={className}
        />
      )}
    </div>
  );
}
