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
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    localStorage.setItem("reduce-motion", String(reduceMotion));
    if (reduceMotion) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
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
