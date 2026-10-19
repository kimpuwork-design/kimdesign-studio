import { describe, expect, it } from "vitest";
import { shouldOpenCommandPalette } from "@/lib/keyboard";

function press(target: HTMLElement, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true, cancelable: true, ...options });
  target.dispatchEvent(event);
  return event;
}

describe("command palette shortcut", () => {
  it("opens with Ctrl+K and Command+K outside fields", () => {
    expect(shouldOpenCommandPalette(press(document.body))).toBe(true);
    expect(shouldOpenCommandPalette(press(document.body, { ctrlKey: false, metaKey: true }))).toBe(true);
    expect(shouldOpenCommandPalette(press(document.body, { ctrlKey: false }))).toBe(false);
  });
  it("does not interrupt form controls", () => {
    for (const tag of ["input", "textarea", "select"]) {
      expect(shouldOpenCommandPalette(press(document.createElement(tag)))).toBe(false);
    }
  });
  it("does not interrupt nested rich text or custom textboxes", () => {
    const editor = document.createElement("div");
    editor.setAttribute("contenteditable", "true");
    const child = editor.appendChild(document.createElement("span"));
    expect(shouldOpenCommandPalette(press(child))).toBe(false);
    editor.removeAttribute("contenteditable");
    editor.setAttribute("role", "textbox");
    expect(shouldOpenCommandPalette(press(child))).toBe(false);
  });
  it("ignores composition, repeats and already handled events", () => {
    expect(shouldOpenCommandPalette(press(document.body, { isComposing: true }))).toBe(false);
    expect(shouldOpenCommandPalette(press(document.body, { repeat: true }))).toBe(false);
    const event = press(document.body);
    event.preventDefault();
    expect(shouldOpenCommandPalette(event)).toBe(false);
  });
});