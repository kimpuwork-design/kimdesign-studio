import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useState, useRef } from "react";

interface Section {
  id: string;
  label: string;
}

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

export function SectionIndicator({ sections }: { sections: Section[] }) {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setVisible(scrollY > window.innerHeight * 0.5);

      let current = 0;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) {
          current = i;
          break;
        }
      }
      setActive(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 20 }}
      transition={{ duration: 0.5, ease }}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-5"
      aria-label="Section navigation"
    >
      {sections.map((s, i) => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className="group flex items-center gap-3 py-1"
          aria-label={`Go to ${s.label}`}
        >
          {/* Label — visible on hover */}
          <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/0 group-hover:text-muted-foreground transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            {s.label}
          </span>

          {/* Dot */}
          <span className="relative flex items-center justify-center w-3 h-3">
            <motion.span
              animate={{
                scale: active === i ? 1 : 0.5,
                opacity: active === i ? 1 : 0.3,
              }}
              transition={{ duration: 0.4, ease }}
              className={`block rounded-full transition-colors duration-300 ${
                active === i
                  ? "w-2 h-2 bg-primary"
                  : "w-1.5 h-1.5 bg-muted-foreground"
              }`}
            />
            {active === i && (
              <motion.span
                layoutId="section-ring"
                className="absolute inset-0 rounded-full border border-primary/30"
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
              />
            )}
          </span>
        </button>
      ))}
    </motion.nav>
  );
}
