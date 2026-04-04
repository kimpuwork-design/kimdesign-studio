import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { KMonogramLogo } from "@/components/KMonogramLogo";

const luxuryEase = [0.22, 1, 0.36, 1] as const;

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] right-[10%] w-[180px] h-[180px] border border-primary/[0.04] rotate-12" />
        <div className="absolute bottom-[20%] left-[8%] w-[100px] h-[100px] border border-primary/[0.04] rounded-full" />
        <div className="absolute top-[40%] left-[15%] w-px h-[120px] bg-gradient-to-b from-transparent via-primary/[0.06] to-transparent" />
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

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-[10px] tracking-[0.3em] uppercase text-primary/60 mb-4"
        >
          Page not found
        </motion.p>

        <h1 className="font-display text-[clamp(5rem,15vw,10rem)] leading-[0.85] text-foreground/10 font-light">
          404
        </h1>

        <p className="text-muted-foreground text-sm leading-relaxed mt-4 mb-10 max-w-xs mx-auto">
          The page you're looking for doesn't exist or has been moved.
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
            <Link to="/">
              <Home size={12} className="mr-2" />
              Home
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;