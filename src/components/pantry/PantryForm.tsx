"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import type { PantryInput } from "@/hooks/usePantry";
import type { PantryItem } from "@/types/database";

const UNITS = ["count", "lbs", "oz", "cups", "tbsp", "cans", "bottles"];
const CATEGORIES = ["Produce", "Meat", "Dairy", "Pantry", "Frozen", "Beverages", "Other"];

const EMPTY: PantryInput = {
  name: "",
  quantity: 1,
  unit: "count",
  category: "Pantry",
  expiryDate: "",
  lowStockThreshold: "",
  notes: "",
};

function itemToInput(item: PantryItem): PantryInput {
  return {
    name: item.name,
    quantity: item.quantity,
    unit: item.unit || "count",
    category: item.category || "Pantry",
    expiryDate: item.expiry_date ?? "",
    lowStockThreshold: item.low_stock_threshold ?? "",
    notes: item.notes ?? "",
  };
}

export function PantryForm({
  open,
  onClose,
  onSave,
  initialItem,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: PantryInput) => Promise<void>;
  initialItem?: PantryItem | null;
}) {
  const [form, setForm] = useState<PantryInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(initialItem ? itemToInput(initialItem) : EMPTY);
  }, [initialItem, open]);

  async function handleSubmit() {
    if (!String(form.name).trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  }

  const isEditing = !!initialItem;

  return (
    <BottomSheet open={open} onClose={onClose} title={isEditing ? "Edit Item" : "Add to Pantry"}>
      <div className="space-y-3 p-5">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Item name"
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-base"
          autoFocus={!isEditing}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            step="0.25"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="rounded-lg border border-border bg-bg px-4 py-3 text-base"
          />
          <select
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="rounded-lg border border-border bg-bg px-3 py-3 text-sm"
          >
            {UNITS.map((unit) => <option key={unit}>{unit}</option>)}
          </select>
        </div>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full rounded-lg border border-border bg-bg px-3 py-3 text-sm"
        >
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
        <div>
          <label className="mb-1 block text-xs font-medium text-text-muted">Expiry date</label>
          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
            className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm"
          />
        </div>
        <input
          type="number"
          min="0"
          step="0.25"
          value={form.lowStockThreshold}
          onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
          placeholder="Low stock threshold (optional)"
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-base"
        />
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-base"
        />
        <button
          onClick={handleSubmit}
          disabled={!String(form.name).trim() || saving}
          className="min-h-touch w-full rounded-card bg-accent-gradient text-white font-semibold shadow-accent-glow disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
        >
          {saving ? "Saving…" : isEditing ? "Save Changes" : "Add Item"}
        </button>
      </div>
    </BottomSheet>
  );
}
