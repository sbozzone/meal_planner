"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/shared/BottomSheet";
import type { DayPlan, MealTemplate, MealTemplateMeal } from "@/types/database";
import { useMealTemplates } from "@/hooks/useMealTemplates";
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function TemplatesModal({
  open,
  onClose,
  weekStart,
  days,
  onLoaded,
}: {
  open: boolean;
  onClose: () => void;
  weekStart: string;
  days: DayPlan[];
  onLoaded: () => Promise<void>;
}) {
  const { templates, saveTemplate, loadTemplate, deleteTemplate } = useMealTemplates();
  const [savingNew, setSavingNew] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const meals: MealTemplateMeal[] = days.flatMap((day, index) =>
    day.meals.map((meal) => ({
      dayOfWeek: index,
      dishId: meal.dish_id,
      dishName: meal.dish?.name || null,
      customName: meal.custom_name,
    }))
  );

  async function handleSave() {
    if (!name.trim()) return;
    await saveTemplate(name.trim(), description.trim(), meals);
    setName("");
    setDescription("");
    setSavingNew(false);
  }

  async function handleLoad(template: MealTemplate) {
    if (!window.confirm(`Load ${template.name} to this week? Existing meals for the week will be replaced.`)) {
      return;
    }
    setLoadingId(template.id);
    const ok = await loadTemplate(template.id, weekStart);
    setLoadingId(null);
    if (ok) {
      await onLoaded();
      onClose();
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Meal Templates">
      <div className="space-y-4 p-5">
        {savingNew ? (
          <div className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name"
              className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-base"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-base"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSavingNew(false)}
                className="min-h-touch rounded-card border border-border bg-card font-medium text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || meals.length === 0}
                className="min-h-touch rounded-card bg-accent font-semibold text-white disabled:opacity-50"
              >
                Save Template
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSavingNew(true)}
            className="min-h-touch w-full rounded-card bg-accent px-4 py-3 font-semibold text-white disabled:opacity-50"
            disabled={meals.length === 0}
          >
            Save this week as template
          </button>
        )}

        <div className="space-y-2">
          {templates.length === 0 ? (
            <div className="rounded-card border border-border-light bg-bg px-4 py-8 text-center text-sm text-text-muted">
              No templates saved yet.
            </div>
          ) : (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                loading={loadingId === template.id}
                onLoad={() => handleLoad(template)}
                onDelete={() => deleteTemplate(template.id)}
              />
            ))
          )}
        </div>
      </div>
    </BottomSheet>
  );
}

function TemplateCard({
  template,
  loading,
  onLoad,
  onDelete,
}: {
  template: MealTemplate;
  loading: boolean;
  onLoad: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-card border border-border-light bg-card p-3">
      <div className="flex items-start gap-2">
        <button onClick={() => setExpanded((prev) => !prev)} className="min-h-touch min-w-[32px] text-text-muted">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-text">{template.name}</h3>
          {template.description && (
            <p className="text-sm text-text-secondary">{template.description}</p>
          )}
        </div>
        <button
          onClick={onLoad}
          disabled={loading}
          className="min-h-touch rounded-lg bg-accent px-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Loading" : "Load"}
        </button>
        <button
          onClick={onDelete}
          className="flex min-h-touch min-w-[44px] items-center justify-center rounded-lg text-text-muted hover:bg-red/5 hover:text-red"
          aria-label={`Delete ${template.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {expanded && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {template.meals.map((meal, index) => (
            <div key={`${meal.dayOfWeek}-${index}`} className="rounded-lg bg-bg px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                {DAY_NAMES[meal.dayOfWeek]}
              </p>
              <p className="truncate text-sm text-text">
                {meal.dishName || meal.customName || "Open"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
