"use client";

import { CalendarClock, Dices, Plus, Sparkles } from "lucide-react";
import { memo } from "react";
import { cn, getMealEmoji } from "@/lib/utils";
import { MealChip } from "@/components/meal-plan/MealChip";
import { ChefChip, formatActivityTime } from "@/components/meal-plan/ChefChip";
import { FUN_OPTIONS } from "@/types/database";
import type { DayPlan, DinnerActivity } from "@/types/database";

/**
 * Oversized, celebratory card for today's dinner — the first thing the family
 * sees when they open the plan. Replaces the regular DayCard for today.
 */
export const TonightHero = memo(function TonightHero({
  day,
  familyId,
  onTapToAssign,
  onAddActivity,
  onEditActivity,
  onRemoveMeal,
  onSetChef,
  onSurpriseMe,
  canSurprise,
}: {
  day: DayPlan;
  familyId: string;
  onTapToAssign: (date: string) => void;
  onAddActivity: (date: string) => void;
  onEditActivity: (activity: DinnerActivity) => void;
  onRemoveMeal: (mealId: string) => void;
  onSetChef: (date: string) => void;
  onSurpriseMe: () => void;
  canSurprise: boolean;
}) {
  const mainMeal = day.meals[0] ?? null;
  const sideMeals = day.meals.slice(1);
  const activities = day.activities ?? [];
  const chef = day.chef ?? null;

  const mainName = mainMeal
    ? mainMeal.dish?.name || mainMeal.custom_name || "Dinner"
    : null;
  const funOption = mainName ? FUN_OPTIONS.find((o) => o.label === mainName) : null;
  const heroEmoji = mainName
    ? funOption?.emoji ?? getMealEmoji(mainName) ?? "🍽️"
    : "🍽️";

  return (
    <article className="animate-rise relative overflow-hidden rounded-3xl bg-today-gradient shadow-warm-md ring-2 ring-accent/40">
      {/* Decorative oversized emoji watermark */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-5 -top-6 select-none text-[110px] leading-none opacity-[0.13] [transform:rotate(12deg)]"
      >
        {heroEmoji}
      </span>
      <span aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-accent-gradient" />

      <div className="relative px-4 pb-4 pt-4">
        {/* Eyebrow: Tonight badge + date + chef */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-accent-gradient px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-accent-glow">
              <Sparkles className="h-3 w-3" />
              Tonight
            </span>
            <span className="font-serif text-sm font-semibold text-accent-dark">
              {day.dayName} {day.dayNumber}
            </span>
          </div>
          <ChefChip chef={chef} onClick={() => onSetChef(day.date)} />
        </div>

        {mainMeal ? (
          <>
            {/* Headline dish */}
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-4xl shadow-warm-sm">
                {heroEmoji}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-serif text-2xl font-bold leading-tight text-accent-dark">
                  {mainName}
                </h2>
                {chef && (
                  <p className="mt-0.5 text-sm font-medium text-text-secondary">
                    {chef} is cooking
                  </p>
                )}
              </div>
            </div>

            {/* Main meal chip carries the votes */}
            <div className="mt-3">
              <MealChip meal={mainMeal} onRemove={onRemoveMeal} familyId={familyId} isMain />
            </div>
            {sideMeals.length > 0 && (
              <div className="mt-1.5 space-y-1.5">
                {sideMeals.map((meal) => (
                  <MealChip key={meal.id} meal={meal} onRemove={onRemoveMeal} familyId={familyId} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="mt-3">
            <h2 className="font-serif text-2xl font-bold leading-tight text-text">
              What&apos;s for dinner tonight?
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Pick a favorite, type anything, or let fate decide.
            </p>
            <div className={cn("mt-3 grid gap-2", canSurprise ? "grid-cols-2" : "grid-cols-1")}>
              <button
                onClick={() => onTapToAssign(day.date)}
                className="flex min-h-touch items-center justify-center gap-2 rounded-xl bg-accent-gradient px-4 py-3 text-sm font-bold text-white shadow-accent-glow transition-all hover:brightness-[1.04] active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                Plan tonight
              </button>
              {canSurprise && (
                <button
                  onClick={onSurpriseMe}
                  className="group flex min-h-touch items-center justify-center gap-2 rounded-xl border border-accent/35 bg-white/70 px-4 py-3 text-sm font-bold text-accent-dark transition-all hover:bg-white active:scale-[0.98]"
                >
                  <Dices className="h-4 w-4 transition-transform group-hover:animate-wiggle" />
                  Surprise me
                </button>
              )}
            </div>
          </div>
        )}

        {/* Activities affecting tonight */}
        {activities.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
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

        {/* Secondary actions once dinner is planned */}
        {mainMeal && (
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <button
              onClick={() => onTapToAssign(day.date)}
              className="flex min-h-touch items-center justify-center gap-1.5 rounded-xl bg-white/60 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-accent-light hover:text-accent active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Add side
            </button>
            <button
              onClick={() => onAddActivity(day.date)}
              className="flex min-h-touch items-center justify-center gap-1.5 rounded-xl bg-white/60 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-blue/10 hover:text-blue active:scale-[0.98]"
            >
              <CalendarClock className="h-4 w-4" />
              Activity
            </button>
          </div>
        )}
      </div>
    </article>
  );
});
