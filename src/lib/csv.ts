/**
 * Minimal RFC-4180-ish CSV export.
 * Quotes fields that contain commas, quotes, or newlines.
 */
function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = typeof value === "string" ? value : String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCSV<T>(
  rows: T[],
  columns: { key: keyof T; header: string }[],
): string {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows
    .map((r) => columns.map((c) => escapeCell(r[c.key])).join(","))
    .join("\n");
  // Excel-friendly BOM so UTF-8 names render correctly.
  return "\ufeff" + head + "\n" + body;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke so Safari finishes the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportCSV<T>(
  filename: string,
  rows: T[],
  columns: { key: keyof T; header: string }[],
) {
  downloadCSV(filename, toCSV(rows, columns));
}
