"use client";

import { CalendarClock, Plus } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { MealChip } from "@/components/meal-plan/MealChip";
import { ChefChip, formatActivityTime } from "@/components/meal-plan/ChefChip";
import type { DayPlan, DinnerActivity } from "@/types/database";

const TODAY = new Date().toISOString().split("T")[0];

export const DayCard = memo(function DayCard({
  day,
  index = 0,
  onTapToAssign,
  onAddActivity,
  onEditActivity,
  onRemoveMeal,
  onSetChef,
  familyId,
}: {
  day: DayPlan;
  index?: number;
  onTapToAssign: (date: string) => void;
  onAddActivity: (date: string) => void;
  onEditActivity: (activity: DinnerActivity) => void;
  onRemoveMeal: (mealId: string) => void;
  onSetChef: (date: string) => void;
  familyId: string;
}) {
  const mainMeal = day.meals[0] ?? null;
  const sideMeals = day.meals.slice(1);
  const activities = day.activities ?? [];
  const chef = day.chef ?? null;
  const isPast = day.date < TODAY;
  const isWeekend = ["Saturday", "Sunday"].includes(day.dayName);
  const fullyEmpty = day.meals.length === 0 && activities.length === 0;

  return (
    <article
      className={cn(
        "animate-rise relative overflow-hidden rounded-2xl transition-shadow",
        day.isToday
          ? "bg-today-gradient shadow-warm-md ring-2 ring-accent/35"
          : isPast
          ? "border border-border-light/70 bg-card-header/40 shadow-warm-sm"
          : "border border-border-light bg-card shadow-warm-sm hover:shadow-warm"
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      {/* Accent rail */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-0 left-0 w-1.5",
          day.isToday
            ? "bg-accent-gradient"
            : isPast
            ? "bg-border"
            : isWeekend
            ? "bg-blue/45"
            : "bg-accent/40"
        )}
      />

      <div className="flex gap-3 py-3 pl-4 pr-3">
        {/* Date column */}
        <div className="flex w-11 shrink-0 flex-col items-center pt-0.5 text-center">
          <span
            className={cn(
              "text-[11px] font-bold uppercase tracking-wide",
              day.isToday
                ? "text-accent"
                : isWeekend && !isPast
                ? "text-blue"
                : "text-text-muted"
            )}
          >
            {day.shortName}
          </span>
          <span
            className={cn(
              "font-serif text-[26px] font-bold leading-none",
              day.isToday
                ? "text-accent"
                : isPast
                ? "text-text-muted"
                : isWeekend
                ? "text-blue"
                : "text-text"
            )}
          >
            {day.dayNumber}
          </span>
          {day.isToday && (
            <span className="mt-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
              Today
            </span>
          )}
        </div>

        {/* Content column */}
        <div className="min-w-0 flex-1">
          {/* Top meta row: full weekday + chef */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <span
              className={cn(
                "font-serif text-[15px] font-semibold leading-none",
                day.isToday ? "text-accent-dark" : isPast ? "text-text-muted" : "text-text"
              )}
            >
              {day.dayName}
            </span>
            <ChefChip chef={chef} onClick={() => onSetChef(day.date)} />
          </div>

          {/* Meals */}
          {mainMeal && (
            <MealChip meal={mainMeal} onRemove={onRemoveMeal} familyId={familyId} isMain />
          )}
          {sideMeals.length > 0 && (
            <div className="mt-1.5 space-y-1.5">
              {sideMeals.map((meal) => (
                <MealChip key={meal.id} meal={meal} onRemove={onRemoveMeal} familyId={familyId} />
              ))}
            </div>
          )}

          {/* Activities */}
          {activities.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {activities.map((activity) => (
                <button
                  key={activity.id}
                  className="flex w-full items-start gap-2.5 rounded-xl border border-blue/20 bg-blue/8 px-3 py-2 text-left transition-colors hover:bg-blue/12"
                  type="button"
                  onClick={() => onEditActivity(activity)}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue/15 text-blue">
                    <CalendarClock className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-text">
                      {activity.title}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {formatActivityTime(activity)}
                      {activity.notes ? ` · ${activity.notes}` : ""}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          {fullyEmpty ? (
            <button
              onClick={() => onTapToAssign(day.date)}
              className={cn(
                "group flex min-h-[68px] w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed transition-all active:scale-[0.99]",
                isPast
                  ? "border-border bg-card-header/40 text-text-muted hover:text-text-secondary"
                  : "border-accent/35 bg-accent-light/40 text-accent-dark hover:border-accent/55 hover:bg-accent-light/70"
              )}
            >
              <span className="text-2xl leading-none transition-transform group-active:scale-90">🍽️</span>
              <span className="text-sm font-semibold">
                {isPast ? "Add dinner" : "What's cooking?"}
              </span>
              {!isPast && (
                <span className="text-[11px] text-text-muted">Tap to plan · free night · takeout</span>
              )}
            </button>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                onClick={() => onTapToAssign(day.date)}
                className="flex min-h-touch items-center justify-center gap-1.5 rounded-xl bg-card-header/80 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-accent-light hover:text-accent active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                {day.meals.length === 0 ? "Add dinner" : "Add side"}
              </button>
              <button
                onClick={() => onAddActivity(day.date)}
                className="flex min-h-touch items-center justify-center gap-1.5 rounded-xl bg-card-header/80 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-blue/10 hover:text-blue active:scale-[0.98]"
              >
                <CalendarClock className="h-4 w-4" />
                Activity
              </button>
            </div>
          )}

          {fullyEmpty && (
            <button
              onClick={() => onAddActivity(day.date)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 py-1 text-xs font-medium text-text-muted transition-colors hover:text-blue"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Add an activity instead
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
