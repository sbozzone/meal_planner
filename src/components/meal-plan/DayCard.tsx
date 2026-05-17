"use client";

import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DayPlan, MealPlan } from "@/types/database";

export function DayCard({
  day,
  onTapToAssign,
  onRemoveMeal,
}: {
  day: DayPlan;
  onTapToAssign: (date: string) => void;
  onRemoveMeal: (mealId: string) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-card border transition-colors",
        day.isToday
          ? "border-accent/40 bg-accent-light/50"
          : "border-border-light bg-card"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-light/50">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-medium text-sm",
              day.isToday ? "text-accent font-semibold" : "text-text"
            )}
          >
            {day.dayName}
          </span>
          <span className="text-xs text-text-muted">{day.dayNumber}</span>
        </div>
        {day.isToday && (
          <span className="text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded-full uppercase tracking-wider">
            Today
          </span>
        )}
      </div>

      <div className="p-3 min-h-[60px]">
        {day.meals.length > 0 && (
          <div className="space-y-2 mb-2">
            {day.meals.map((meal) => (
              <MealChip key={meal.id} meal={meal} onRemove={onRemoveMeal} />
            ))}
          </div>
        )}
        <button
          onClick={() => onTapToAssign(day.date)}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-text-muted hover:border-accent/40 hover:text-accent hover:bg-accent-light/30 transition-colors min-h-touch",
            day.meals.length > 0 ? "py-1.5" : "py-3"
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">{day.meals.length > 0 ? "Add another" : "Add dinner"}</span>
        </button>
      </div>
    </div>
  );
}

function MealChip({
  meal,
  onRemove,
}: {
  meal: MealPlan;
  onRemove: (id: string) => void;
}) {
  const name = meal.dish?.name || meal.custom_name || "Unknown dish";

  return (
    <div className="flex items-center gap-2 bg-accent-light/70 text-accent-dark rounded-lg px-3 py-2.5">
      <span className="flex-1 text-sm font-medium truncate">{name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(meal.id);
        }}
        className="p-1 rounded hover:bg-accent/10 transition-all shrink-0"
        aria-label={`Remove ${name}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
