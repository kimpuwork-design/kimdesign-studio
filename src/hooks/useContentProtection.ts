import { useEffect } from "react";

/**
 * Global content protection hook — prevents common download/capture methods.
 * Apply once at the layout level for public pages.
 */
export function useContentProtection() {
  useEffect(() => {
    // Prevent right-click on all images & videos
    const handleContextMenu = (e: MouseEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (["img", "video", "canvas"].includes(tag) || 
          (e.target as HTMLElement)?.closest?.(".protected-media-container")) {
        e.preventDefault();
      }
    };

    // Block common keyboard shortcuts for saving/printing
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S (Save page)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
      }
      // Ctrl+Shift+S / Cmd+Shift+S (Save As)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") {
        e.preventDefault();
      }
      // Ctrl+P / Cmd+P (Print — can screenshot)
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
      }
      // Ctrl+Shift+I (DevTools — makes it slightly harder)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
      }
      // PrintScreen key
      if (e.key === "PrintScreen") {
        e.preventDefault();
        // Briefly blur images to frustrate screenshot attempts
        document.querySelectorAll(".protected-media-container img").forEach((img) => {
          (img as HTMLElement).style.filter = "blur(20px)";
          setTimeout(() => {
            (img as HTMLElement).style.filter = "";
          }, 1500);
        });
      }
    };

    // Prevent drag on images globally
    const handleDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement)?.tagName?.toLowerCase() === "img") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);
}
