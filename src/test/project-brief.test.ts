import { describe, it, expect } from "vitest";
import { briefToMessage } from "@/components/public/ProjectBriefAssistant";

const brief = {
  recommended_service: "Architectural Design",
  reason: "r", brief_title: "Family House", summary: "A house.",
  scope: ["Site study"], deliverables: [], questions: [], next_step: "",
};

describe("briefToMessage", () => {
  it("includes the recommended service and original description", () => {
    const m = briefToMessage(brief, "I need a house in Yangon");
    expect(m).toContain("Recommended service: Architectural Design");
    expect(m).toContain("I need a house in Yangon");
  });
  it("never exceeds the 2000-character contact message limit", () => {
    expect(briefToMessage(brief, "x".repeat(5000)).length).toBe(2000);
  });
});
