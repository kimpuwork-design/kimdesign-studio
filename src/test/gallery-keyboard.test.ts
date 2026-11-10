import { describe, expect, it } from "vitest";
import { galleryFocusIndex } from "@/lib/gallery-keyboard";

const key = (key: string, extra = {}) => ({ key, defaultPrevented: false, isComposing: false, altKey: false, ctrlKey: false, metaKey: false, ...extra });

describe("gallery keyboard navigation", () => {
  it("moves between images with arrows, wrapping at each end", () => {
    expect(galleryFocusIndex(key("ArrowRight"), 2, 3)).toBe(0);
    expect(galleryFocusIndex(key("ArrowLeft"), 0, 3)).toBe(2);
    expect(galleryFocusIndex(key("ArrowDown"), 0, 3)).toBe(1);
    expect(galleryFocusIndex(key("ArrowUp"), 1, 3)).toBe(0);
  });
  it("supports first and last image navigation", () => {
    expect(galleryFocusIndex(key("Home"), 1, 3)).toBe(0);
    expect(galleryFocusIndex(key("End"), 1, 3)).toBe(2);
  });
  it("preserves activation keys and guarded events", () => {
    for (const event of [key("Enter"), key(" "), key("ArrowRight", { defaultPrevented: true }), key("End", { isComposing: true }), key("Home", { ctrlKey: true }), key("ArrowLeft", { metaKey: true }), key("ArrowDown", { altKey: true })]) {
      expect(galleryFocusIndex(event, 0, 3)).toBeNull();
    }
    expect(galleryFocusIndex(key("End"), 0, 0)).toBeNull();
  });
});