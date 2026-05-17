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
  const mainMeal = day.meals[0] ?? null;
  const sideMeals = day.meals.slice(1);

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
        {mainMeal && (
          <MealChip meal={mainMeal} onRemove={onRemoveMeal} isMain />
        )}

        {sideMeals.length > 0 && (
          <div className="mt-1.5 pl-2 space-y-1 border-l-2 border-border-light">
            {sideMeals.map((meal) => (
              <MealChip key={meal.id} meal={meal} onRemove={onRemoveMeal} />
            ))}
          </div>
        )}

        <button
          onClick={() => onTapToAssign(day.date)}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-text-muted hover:border-accent/40 hover:text-accent hover:bg-accent-light/30 transition-colors min-h-touch",
            day.meals.length > 0 ? "mt-2 py-1" : "py-3"
          )}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">
            {day.meals.length === 0 ? "Add dinner" : "Add side dish"}
          </span>
        </button>
      </div>
    </div>
  );
}

function MealChip({
  meal,
  onRemove,
  isMain = false,
}: {
  meal: MealPlan;
  onRemove: (id: string) => void;
  isMain?: boolean;
}) {
  const name = meal.dish?.name || meal.custom_name || "Unknown dish";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3",
        isMain
          ? "bg-accent-light/70 text-accent-dark py-2.5"
          : "bg-bg text-text-secondary border border-border-light py-2"
      )}
    >
      {!isMain && (
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider shrink-0">
          Side
        </span>
      )}
      <span className="flex-1 text-sm font-medium truncate">{name}</span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove(meal.id);
        }}
        className="p-1 rounded hover:bg-black/5 transition-all shrink-0"
        aria-label={`Remove ${name}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
