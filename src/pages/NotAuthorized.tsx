import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft, LayoutDashboard } from "lucide-react";
import { KMonogramLogo } from "@/components/KMonogramLogo";

const luxuryEase = [0.22, 1, 0.36, 1] as const;

export default function NotAuthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[12%] w-[140px] h-[140px] border border-destructive/[0.04] rotate-45" />
        <div className="absolute bottom-[25%] left-[10%] w-[80px] h-[80px] border border-primary/[0.04] rounded-full" />
      </div>
      <div className="absolute inset-0 noise-overlay pointer-events-none z-[1]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: luxuryEase }}
        className="relative z-10 text-center max-w-lg px-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: luxuryEase }}
          className="flex justify-center mb-8"
        >
          <KMonogramLogo size={48} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, ease: luxuryEase }}
          className="flex justify-center mb-6"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldX size={28} className="text-destructive/70" />
          </div>
        </motion.div>

        <p className="text-[10px] tracking-[0.3em] uppercase text-destructive/60 mb-3">Access Denied</p>

        <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight mb-4">
          Not Authorized
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto mb-10">
          You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            className="rounded-none tracking-[0.1em] text-xs uppercase px-6 h-11 border-foreground/15 hover:bg-foreground hover:text-background transition-all duration-500"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={12} className="mr-2" />
            Go back
          </Button>
          <Button
            className="rounded-none tracking-[0.1em] text-xs uppercase px-6 h-11 transition-all duration-500"
            asChild
          >
            <Link to="/app">
              <LayoutDashboard size={12} className="mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}