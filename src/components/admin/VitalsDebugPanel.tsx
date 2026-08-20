import { useEffect, useState } from "react";
import { subscribeToVitals } from "@/lib/vitals";
import { Metric } from "web-vitals";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, X } from "lucide-react";

export function VitalsDebugPanel() {
  const [metrics, setMetrics] = useState<Record<string, Metric>>({});
  const [isOpen, setIsOpen] = useState(false);
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (!isDev) return;
    const unsubscribe = subscribeToVitals((metric) => {
      setMetrics((prev) => ({ ...prev, [metric.name]: metric }));
    });
    return () => unsubscribe();
  }, [isDev]);

  if (!isDev) return null;

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "good": return "text-emerald-400";
      case "needs-improvement": return "text-amber-400";
      case "poor": return "text-rose-400";
      default: return "text-white/60";
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] font-mono text-[10px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-black/80 text-white backdrop-blur-md border border-white/10 hover:bg-black transition-colors"
        title="Toggle Vitals Debug"
      >
        {isOpen ? <X size={14} /> : <Activity size={14} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-10 left-0 w-48 overflow-hidden rounded-lg border border-white/10 bg-black/90 p-3 text-white shadow-2xl backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-1 text-[9px] uppercase tracking-wider text-white/40">
              <span>Core Web Vitals</span>
              <span className="text-[8px] opacity-50">Live</span>
            </div>
            <div className="space-y-2">
              {["LCP", "CLS", "FCP", "TTFB"].map((name) => {
                const m = metrics[name];
                return (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-white/60">{name}</span>
                    <span className={`font-bold ${m ? getRatingColor(m.rating) : "text-white/20"}`}>
                      {m ? (name === "CLS" ? m.value.toFixed(3) : `${Math.round(m.value)}ms`) : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 text-[8px] text-white/30 italic">
              Values update as you interact.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
