import { describe, it, expect } from "vitest";
import { getAiBriefService, sanitizeLeadSearch } from "@/lib/leads";
import { briefToMessage } from "@/components/public/ProjectBriefAssistant";

describe("getAiBriefService", () => {
  it("reads the service from a message built by the AI brief", () => {
    const msg = "[Project Type: Interior Architecture]\n\n" + briefToMessage({
      recommended_service: "Interior Architecture", reason: "", brief_title: "Condo", summary: "s",
      scope: [], deliverables: [], questions: [], next_step: "",
    }, "renovate my condo");
    expect(getAiBriefService(msg)).toBe("Interior Architecture");
  });
  it("returns null for ordinary contact messages", () => {
    expect(getAiBriefService("Hello, I would like a quote for my house.")).toBeNull();
  });
});

describe("sanitizeLeadSearch", () => {
  it("removes characters that break the search filter", () => {
    expect(sanitizeLeadSearch("kim, (test)")).toBe("kim test");
  });
});
