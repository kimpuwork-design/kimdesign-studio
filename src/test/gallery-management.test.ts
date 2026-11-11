import { describe, expect, it } from "vitest";
import { moveGalleryImage } from "@/lib/gallery-management";

describe("admin gallery order", () => {
  it("reorders photos while preserving every photo and the original order", () => {
    const photos = ["church-front", "church-interior", "church-side"];
    expect(moveGalleryImage(photos, 2, 0)).toEqual(["church-side", "church-front", "church-interior"]);
    expect(moveGalleryImage(photos, 0, 2)).toEqual(["church-interior", "church-side", "church-front"]);
    expect(photos).toEqual(["church-front", "church-interior", "church-side"]);
  });
  it("ignores positions outside the gallery", () => {
    const photos = ["front", "interior"];
    expect(moveGalleryImage(photos, -1, 0)).toBe(photos);
    expect(moveGalleryImage(photos, 0, 2)).toBe(photos);
    expect(moveGalleryImage(photos, 0, 0.5)).toBe(photos);
  });
});