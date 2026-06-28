import { useCallback, useMemo, useState } from "react";

/**
 * Generic multi-row selection state machine for admin tables.
 *
 *   const sel = useBulkSelection(rows.map(r => r.id));
 *   sel.toggle(id) / sel.toggleAll() / sel.clear()
 *   sel.isSelected(id) / sel.allSelected / sel.someSelected / sel.count
 *   sel.selectedIds  -> string[]
 */
export function useBulkSelection(allIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectAll = useCallback(() => setSelected(new Set(allIds)), [allIds]);

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      // If every visible id is already selected, clear; otherwise select all.
      const everySelected = allIds.length > 0 && allIds.every((id) => prev.has(id));
      return everySelected ? new Set() : new Set(allIds);
    });
  }, [allIds]);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const allSelected = useMemo(
    () => allIds.length > 0 && allIds.every((id) => selected.has(id)),
    [allIds, selected],
  );
  const someSelected = useMemo(
    () => !allSelected && allIds.some((id) => selected.has(id)),
    [allIds, allSelected, selected],
  );

  return {
    selected,
    selectedIds,
    count: selected.size,
    isSelected,
    toggle,
    toggleAll,
    selectAll,
    clear,
    allSelected,
    someSelected,
  };
}
