import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

/**
 * Subtle page transition for admin/staff/client portal pages.
 * Keyed by pathname so a fresh fade/translate runs on every navigation.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
