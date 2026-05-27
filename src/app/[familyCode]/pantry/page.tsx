"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { PantryForm } from "@/components/pantry/PantryForm";
import { usePantry } from "@/hooks/usePantry";
import { useFamily } from "@/lib/family-context";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import type { PantryItem } from "@/types/database";

export default function PantryPage() {
  const { family } = useFamily();
  const { items, loading, addItem, updateItem, deleteItem } = usePantry();
  const [showForm, setShowForm] = useState(false);
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const visible = expiringOnly
    ? items.filter((item) => item.daysUntilExpiry !== null && (item.daysUntilExpiry ?? 999) <= 7)
    : items;

  const grouped = visible.reduce<Record<string, PantryItem[]>>((acc, item) => {
    const category = item.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  function toggleCategory(category: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  return (
    <>
      <Header title="Pantry" familyCode={family.share_code} />

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-3">
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex min-h-touch flex-1 items-center justify-center gap-2 rounded-card bg-accent px-4 py-3 font-semibold text-white"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
          <button
            onClick={() => setExpiringOnly((prev) => !prev)}
            className={cn(
              "min-h-touch rounded-card border px-4 py-3 text-sm font-medium",
              expiringOnly
                ? "border-gold bg-gold/10 text-gold"
                : "border-border bg-card text-text-secondary"
            )}
          >
            Expiring soon
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-card border border-border-light bg-card" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="rounded-card border border-border-light bg-card px-4 py-10 text-center text-sm text-text-muted">
            {expiringOnly ? "Nothing is expiring soon." : "Your pantry is empty for now."}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, categoryItems]) => {
              const isCollapsed = collapsed.has(category);
              return (
                <section key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="mb-2 flex min-h-touch items-center gap-2 px-1 text-left"
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                      {category}
                    </span>
                    <span className="text-xs text-text-muted">({categoryItems.length})</span>
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-2">
                      {categoryItems.map((item) => (
                        <PantryRow
                          key={item.id}
                          item={item}
                          onConsume={() => updateItem(item.id, { consumed: 1 })}
                          onDelete={() => deleteItem(item.id)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </main>

      <PantryForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={async (item) => {
          await addItem(item);
        }}
      />
    </>
  );
}

function PantryRow({
  item,
  onConsume,
  onDelete,
}: {
  item: PantryItem;
  onConsume: () => void;
  onDelete: () => void;
}) {
  const urgent = item.daysUntilExpiry !== null && (item.daysUntilExpiry ?? 999) <= 3;
  const soon = item.daysUntilExpiry !== null && (item.daysUntilExpiry ?? 999) <= 7;

  return (
    <div className="rounded-card border border-border-light bg-card px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-text">{item.name}</h3>
            {item.lowStock && (
              <span className="rounded-full bg-red/10 px-2 py-0.5 text-[10px] font-semibold text-red">
                Low stock
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-text-secondary">
            {item.quantity} {item.unit || "count"}
          </p>
          {item.daysUntilExpiry !== null && (
            <p className={cn("mt-1 text-xs", urgent ? "text-red" : soon ? "text-gold" : "text-text-muted")}>
              {item.daysUntilExpiry! < 0
                ? `Expired ${Math.abs(item.daysUntilExpiry!)} days ago`
                : `Expires in ${item.daysUntilExpiry} days`}
            </p>
          )}
          {item.notes && <p className="mt-1 text-xs text-text-muted">{item.notes}</p>}
        </div>
        <button
          onClick={onConsume}
          className="flex min-h-touch min-w-[44px] items-center justify-center rounded-lg bg-green/10 text-green"
          aria-label={`Consume one ${item.name}`}
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="flex min-h-touch min-w-[44px] items-center justify-center rounded-lg bg-red/5 text-red"
          aria-label={`Delete ${item.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
