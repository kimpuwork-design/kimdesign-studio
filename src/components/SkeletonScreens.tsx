import { motion } from "framer-motion";

const shimmerClass = "shimmer rounded-lg";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className={`h-11 w-11 rounded-2xl ${shimmerClass}`} />
        <div className="space-y-2">
          <div className={`h-6 w-48 ${shimmerClass}`} />
          <div className={`h-4 w-64 ${shimmerClass}`} />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-3">
            <div className={`h-8 w-8 rounded-lg ${shimmerClass}`} />
            <div className={`h-7 w-16 ${shimmerClass}`} />
            <div className={`h-3 w-20 ${shimmerClass}`} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="glass-card p-5 md:col-span-2">
          <div className={`h-5 w-28 mb-4 ${shimmerClass}`} />
          <div className={`h-[200px] ${shimmerClass}`} />
        </div>
        <div className="glass-card p-5">
          <div className={`h-5 w-28 mb-4 ${shimmerClass}`} />
          <div className={`h-[200px] ${shimmerClass}`} />
        </div>
      </div>
    </div>
  );
}

export function ProjectListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl">
          <div className={`h-10 w-14 rounded-lg ${shimmerClass}`} />
          <div className="flex-1 space-y-2">
            <div className={`h-4 w-40 ${shimmerClass}`} />
            <div className={`h-3 w-24 ${shimmerClass}`} />
          </div>
          <div className={`h-5 w-16 rounded-full ${shimmerClass}`} />
        </div>
      ))}
    </div>
  );
}

export function PortfolioGridSkeleton() {
  return (
    <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className={i === 0 ? "md:col-span-2" : ""}
        >
          <div className={`${i === 0 ? "aspect-[16/9]" : i <= 2 ? "aspect-[3/4]" : "aspect-[4/3]"} ${shimmerClass}`} />
          <div className="mt-3 space-y-2">
            <div className={`h-3 w-16 ${shimmerClass}`} />
            <div className={`h-5 w-48 ${shimmerClass}`} />
            <div className={`h-3 w-24 ${shimmerClass}`} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className={`h-4 ${c === 0 ? "w-32" : c === 1 ? "w-48" : "w-20"} ${shimmerClass}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ClientDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className={`h-11 w-11 rounded-2xl ${shimmerClass}`} />
        <div className="space-y-2">
          <div className={`h-6 w-48 ${shimmerClass}`} />
          <div className={`h-4 w-56 ${shimmerClass}`} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-4 space-y-3">
            <div className={`h-8 w-8 rounded-lg ${shimmerClass}`} />
            <div className={`h-7 w-14 ${shimmerClass}`} />
            <div className={`h-3 w-20 ${shimmerClass}`} />
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass-card p-5 md:col-span-2">
          <div className={`h-5 w-32 mb-4 ${shimmerClass}`} />
          <ProjectListSkeleton count={5} />
        </div>
        <div className="glass-card p-5">
          <div className={`h-5 w-28 mb-4 ${shimmerClass}`} />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <div className={`h-5 w-5 rounded ${shimmerClass}`} />
                <div className="flex-1 space-y-1">
                  <div className={`h-3 w-full ${shimmerClass}`} />
                  <div className={`h-2 w-20 ${shimmerClass}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
