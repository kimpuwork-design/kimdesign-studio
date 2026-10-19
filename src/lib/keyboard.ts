/** Keep global shortcuts out of editable fields and IME composition. */
export function shouldOpenCommandPalette(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey) return false;
  if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return false;
  const target = event.target;
  if (!(target instanceof Element)) return true;
  return !target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]');
}