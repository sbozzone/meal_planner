"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import type { PantryInput } from "@/hooks/usePantry";

const UNITS = ["count", "lbs", "oz", "cups", "tbsp", "cans", "bottles"];
const CATEGORIES = ["Produce", "Meat", "Dairy", "Pantry", "Frozen", "Beverages", "Other"];

export function PantryForm({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (item: PantryInput) => Promise<void>;
}) {
  const [form, setForm] = useState<PantryInput>({
    name: "",
    quantity: 1,
    unit: "count",
    category: "Pantry",
    expiryDate: "",
    lowStockThreshold: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!String(form.name).trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setForm({
      name: "",
      quantity: 1,
      unit: "count",
      category: "Pantry",
      expiryDate: "",
      lowStockThreshold: "",
      notes: "",
    });
    onClose();
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add to Pantry">
      <div className="space-y-3 p-5">
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Item name"
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-base"
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
        <input
          type="date"
          value={form.expiryDate}
          onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-sm"
        />
        <input
          type="number"
          min="0"
          step="0.25"
          value={form.lowStockThreshold}
          onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
          placeholder="Low stock threshold"
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-base"
        />
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Notes"
          rows={3}
          className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-base"
        />
        <button
          onClick={handleSubmit}
          disabled={!String(form.name).trim() || saving}
          className="min-h-touch w-full rounded-card bg-accent text-white font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Item"}
        </button>
      </div>
    </BottomSheet>
  );
}
