import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import { ReactNode, useRef } from "react";

// Shared luxury easing curves
const luxuryEase = [0.22, 1, 0.36, 1] as const;
const smoothEase = [0.16, 1, 0.3, 1] as const;

// Page transition wrapper
export function MotionPage({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: luxuryEase }}
    >
      {children}
    </motion.div>
  );
}

// Fade up on scroll (viewport-triggered)
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export function FadeUp({
  children,
  delay = 0,
  duration = 0.8,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration, delay, ease: luxuryEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Fade in (no Y movement)
export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration, delay, ease: luxuryEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger children container
export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay, delayChildren: 0.1 } },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: luxuryEase } },
};

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Scale on hover card
export function HoverCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.4, ease: luxuryEase } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide in from side
export function SlideIn({
  children,
  direction = "left",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  direction?: "left" | "right";
  delay?: number;
  className?: string;
}) {
  const x = direction === "left" ? -60 : 60;
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: luxuryEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Text reveal — word by word or character animation
export function TextReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, clipPath: "inset(0 0 100% 0)" }}
      whileInView={{ opacity: 1, y: 0, clipPath: "inset(0 0 0% 0)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.9, delay, ease: luxuryEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Line draw animation (decorative)
export function LineDraw({
  className = "",
  delay = 0,
  direction = "horizontal",
}: {
  className?: string;
  delay?: number;
  direction?: "horizontal" | "vertical";
}) {
  return (
    <motion.div
      initial={{ scaleX: direction === "horizontal" ? 0 : 1, scaleY: direction === "vertical" ? 0 : 1 }}
      whileInView={{ scaleX: 1, scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay, ease: luxuryEase }}
      style={{ originX: 0, originY: 0 }}
      className={className}
    />
  );
}

// Parallax scroll wrapper
export function ParallaxSection({
  children,
  className = "",
  speed = 0.3,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 100, -speed * 100]);

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

// Image reveal — clip path animation
export function ImageReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ clipPath: "inset(100% 0 0 0)" }}
      whileInView={{ clipPath: "inset(0% 0 0 0)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 1, delay, ease: luxuryEase }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Counter with spring animation
export function SpringNumber({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: luxuryEase }}
      className={className}
    >
      {children}
    </motion.span>
  );
}