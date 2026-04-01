import { motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  showDot?: boolean;
  animated?: boolean;
}

export function Sparkline({ data, color = "hsl(var(--portal-accent))", height = 32, width = 80, showDot = true, animated = true }: SparklineProps) {
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (v - min) / range) * (height - padding * 2),
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const lastPoint = points[points.length - 1];
  const trend = data.length > 1 ? data[data.length - 1] - data[data.length - 2] : 0;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <motion.path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animated ? { pathLength: 0 } : undefined}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {showDot && lastPoint && (
        <motion.circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        />
      )}
    </svg>
  );
}

export function TrendIndicator({ value, suffix = "" }: { value: number; suffix?: string }) {
  const isPositive = value > 0;
  const isZero = value === 0;

  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
      isZero ? "text-portal-text-muted" : isPositive ? "text-emerald-400" : "text-rose-400"
    }`}>
      {!isZero && (
        <svg width="8" height="8" viewBox="0 0 8 8" className={isPositive ? "" : "rotate-180"}>
          <path d="M4 1L7 5H1L4 1Z" fill="currentColor" />
        </svg>
      )}
      {isZero ? "—" : `${isPositive ? "+" : ""}${value}${suffix}`}
    </span>
  );
}
