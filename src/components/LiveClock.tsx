import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface LiveClockProps {
  timezone?: string;
  label?: string;
  className?: string;
}

export function LiveClock({ timezone = "Asia/Yangon", label = "Yangon", className = "" }: LiveClockProps) {
  const [time, setTime] = useState(() => formatTime(timezone));

  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime(timezone)), 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 1 }}
      className={`flex items-center gap-3 ${className}`}
    >
      {/* Blinking dot */}
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60" style={{ animationDuration: "2s" }} />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
      </span>
      <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60 tabular-nums">
        {label} — {time}
      </span>
    </motion.div>
  );
}

function formatTime(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(new Date());
  } catch {
    return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }
}
