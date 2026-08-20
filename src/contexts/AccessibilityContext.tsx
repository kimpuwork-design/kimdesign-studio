import React, { createContext, useContext, useEffect, useState } from "react";

interface AccessibilityContextType {
  reduceMotion: boolean;
  setReduceMotion: (value: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [reduceMotion, setReduceMotion] = useState(() => {
    const saved = localStorage.getItem("reduce-motion");
    if (saved !== null) return saved === "true";
    // Default to system preference if no user choice is saved
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-update if the user hasn't set a manual override in localStorage
      if (localStorage.getItem("reduce-motion") === null) {
        setReduceMotion(e.matches);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    
    localStorage.setItem("reduce-motion", String(reduceMotion));
    if (reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [reduceMotion]);

  return (
    <AccessibilityContext.Provider value={{ reduceMotion, setReduceMotion }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
}
