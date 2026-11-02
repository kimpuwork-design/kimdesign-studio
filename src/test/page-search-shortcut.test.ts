import { describe, expect, it } from "vitest";
import { shouldFocusPageSearch } from "@/lib/keyboard";

function press(target: HTMLElement, options: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true, ...options });
  target.dispatchEvent(event);
  return event;
}

describe("page search shortcut", () => {
  it("focuses search when / is pressed outside fields", () => {
    expect(shouldFocusPageSearch(press(document.body))).toBe(true);
  });
  it("does not steal / while typing in a field", () => {
    expect(shouldFocusPageSearch(press(document.createElement("input")))).toBe(false);
    expect(shouldFocusPageSearch(press(document.createElement("textarea")))).toBe(false);
  });
  it("ignores other keys and modified presses", () => {
    expect(shouldFocusPageSearch(press(document.body, { key: "a" }))).toBe(false);
    expect(shouldFocusPageSearch(press(document.body, { ctrlKey: true }))).toBe(false);
  });
});
