/** Focus adjacent images without hijacking typing, composition, or modified shortcuts. */
export function galleryFocusIndex(event: Pick<KeyboardEvent, "key" | "defaultPrevented" | "isComposing" | "altKey" | "ctrlKey" | "metaKey">, index: number, total: number): number | null {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || total < 1) return null;
  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown": return (index + 1) % total;
    case "ArrowLeft":
    case "ArrowUp": return (index - 1 + total) % total;
    case "Home": return 0;
    case "End": return total - 1;
    default: return null;
  }
}