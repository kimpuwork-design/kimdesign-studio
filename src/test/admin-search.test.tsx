import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAdminSearch } from "@/hooks/useAdminSearch";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from } }));

type Response = { data: unknown[] | null; error: unknown };
let current: ReturnType<typeof useAdminSearch>;
let root: Root;
let host: HTMLDivElement;
function Probe({ query, enabled }: { query: string; enabled: boolean }) {
  current = useAdminSearch(query, enabled);
  return null;
}
function render(query: string, enabled = true) {
  act(() => root.render(createElement(Probe, { query, enabled })));
}
async function debounce() {
  await act(async () => { vi.advanceTimersByTime(180); });
}
function respond(response: Promise<Response>) {
  from.mockImplementation(() => {
    const chain = { select: vi.fn(), eq: vi.fn(), ilike: vi.fn(), or: vi.fn(), limit: vi.fn(), abortSignal: vi.fn(() => response) };
    for (const method of [chain.select, chain.eq, chain.ilike, chain.or, chain.limit]) method.mockReturnValue(chain);
    return chain;
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  from.mockReset();
  host = document.createElement("div");
  root = createRoot(host);
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); });

describe("portal live search", () => {
  it("does not request data when closed or below two characters", async () => {
    render("house", false);
    await debounce();
    render(" a ");
    await debounce();
    expect(from).not.toHaveBeenCalled();
    expect(current.loading).toBe(false);
  });

  it("searches unified projects rather than legacy portfolio items", async () => {
    respond(Promise.resolve({ data: [], error: null }));
    render("house");
    await debounce();
    expect(from.mock.calls.map(([table]) => table)).toEqual(["profiles", "projects", "leads"]);
    expect(current.loading).toBe(false);
  });

  it("ignores in-flight results after the query is cleared", async () => {
    let resolve: ((value: Response) => void) | undefined;
    respond(new Promise<Response>(done => { resolve = done; }));
    render("house");
    await debounce();
    render("");
    await act(async () => { resolve?.({ data: [{ id: "old", title: "Old house" }], error: null }); });
    expect(current.hits).toEqual([]);
    expect(current.loading).toBe(false);
  });

  it("settles loading with feedback when a request fails", async () => {
    respond(Promise.resolve({ data: null, error: { code: "42501" } }));
    render("house");
    await debounce();
    expect(current.error).not.toBeNull();
    expect(current.loading).toBe(false);
    expect(current.hits).toEqual([]);
  });
});