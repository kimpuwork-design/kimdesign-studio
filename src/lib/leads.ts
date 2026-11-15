/** Leads sent from the AI project brief carry a "Recommended service:" line. */
export function getAiBriefService(message: string | null | undefined): string | null {
  const m = /^Recommended service:\s*(.+)$/m.exec(message ?? "");
  return m ? m[1].trim().slice(0, 80) || null : null;
}

/** Strip characters that break PostgREST `or=(...)` filters so any search text is safe. */
export function sanitizeLeadSearch(term: string): string {
  return term.replace(/[%,()*\\:"]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}
