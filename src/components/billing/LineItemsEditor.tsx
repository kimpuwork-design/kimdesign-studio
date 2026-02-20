import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface LineItem {
  id?: string;
  description: string;
  qty: number;
  unit_price: number;
  line_total: number;
  sort_order: number;
}

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  currency?: string;
  readOnly?: boolean;
}

export function LineItemsEditor({ items, onChange, currency = "USD", readOnly = false }: Props) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);

  const update = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, [field]: value };
      next.line_total = parseFloat((next.qty * next.unit_price).toFixed(2));
      return next;
    });
    onChange(updated);
  };

  const add = () => {
    onChange([...items, { description: "", qty: 1, unit_price: 0, line_total: 0, sort_order: items.length }]);
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((s, i) => s + i.line_total, 0);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted">Description</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted text-right">Qty</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted text-right">Unit Price</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-portal-text-muted text-right">Total</span>
        <span />
      </div>

      {items.map((item, i) => (
        <div key={i} className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-center">
          {readOnly ? (
            <span className="text-sm text-portal-text">{item.description}</span>
          ) : (
            <Input
              value={item.description}
              onChange={(e) => update(i, "description", e.target.value)}
              placeholder="Item description"
              className="h-8 text-sm bg-portal-bg border-portal-border"
            />
          )}
          {readOnly ? (
            <span className="text-sm text-portal-text text-right">{item.qty}</span>
          ) : (
            <Input
              type="number"
              min={0}
              step="0.01"
              value={item.qty}
              onChange={(e) => update(i, "qty", parseFloat(e.target.value) || 0)}
              className="h-8 text-sm text-right bg-portal-bg border-portal-border"
            />
          )}
          {readOnly ? (
            <span className="text-sm text-portal-text text-right">{fmt(item.unit_price)}</span>
          ) : (
            <Input
              type="number"
              min={0}
              step="0.01"
              value={item.unit_price}
              onChange={(e) => update(i, "unit_price", parseFloat(e.target.value) || 0)}
              className="h-8 text-sm text-right bg-portal-bg border-portal-border"
            />
          )}
          <span className="text-sm text-portal-text text-right font-medium">{fmt(item.line_total)}</span>
          {!readOnly ? (
            <button onClick={() => remove(i)} className="text-portal-text-muted hover:text-destructive transition-colors">
              <Trash2 size={14} />
            </button>
          ) : <span />}
        </div>
      ))}

      {!readOnly && (
        <Button type="button" variant="outline" size="sm"
          className="border-dashed border-portal-border text-portal-text-muted mt-2"
          onClick={add}>
          <Plus size={13} className="mr-1.5" />Add Line Item
        </Button>
      )}

      <div className="border-t border-portal-border pt-3 mt-3 flex justify-end">
        <div className="text-sm text-portal-text-muted">
          Subtotal: <span className="text-portal-text font-semibold ml-2">{fmt(subtotal)}</span>
        </div>
      </div>
    </div>
  );
}
