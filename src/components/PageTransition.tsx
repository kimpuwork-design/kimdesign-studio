import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [key, setKey] = useState(location.pathname);

  useEffect(() => {
    setKey(location.pathname);
  }, [location.pathname]);

  return (
    <div key={key} className="animate-page-enter">
      {children}
    </div>
  );
}
