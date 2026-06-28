import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";
import { friendlyErrorMessage } from "@/lib/errors";

// Global safety net — surface uncaught errors as user-facing toasts
// instead of silently failing in the console.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    // eslint-disable-next-line no-console
    console.error("[unhandledrejection]", reason);
    // Ignore noisy aborted fetches / navigation cancellations
    const msg = (reason as { name?: string; message?: string })?.message ?? "";
    if ((reason as { name?: string })?.name === "AbortError") return;
    if (/ResizeObserver loop/i.test(msg)) return;
    toast.error("Unexpected error", {
      description: friendlyErrorMessage(reason),
    });
  });

  window.addEventListener("error", (event) => {
    if (event.error && /ResizeObserver loop/i.test(event.message || "")) return;
    // eslint-disable-next-line no-console
    console.error("[window.error]", event.error || event.message);
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
