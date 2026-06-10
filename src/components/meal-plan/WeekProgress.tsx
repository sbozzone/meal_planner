"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import type { DayPlan } from "@/types/database";

/**
 * At-a-glance week pulse: how many nights are planned, with one tappable
 * segment per day. Turns celebratory when all seven nights are covered.
 */
export const WeekProgress = memo(function WeekProgress({
  days,
  onSelectDay,
}: {
  days: DayPlan[];
  onSelectDay: (date: string) => void;
}) {
  const plannedCount = days.filter((d) => d.meals.length > 0).length;
  const complete = plannedCount === days.length && days.length > 0;

  return (
    <section
      className={cn(
        "animate-rise rounded-2xl border px-4 py-3 shadow-warm-sm transition-colors",
        complete
          ? "border-green/30 bg-green/10"
          : "border-border-light bg-card"
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">
          {complete ? "🎉 Week fully planned!" : "Week at a glance"}
        </p>
        <p
          className={cn(
            "font-serif text-sm font-bold",
            complete ? "text-green" : "text-accent-dark"
          )}
        >
          {plannedCount}
          <span className="font-sans text-xs font-semibold text-text-muted"> / {days.length} nights</span>
        </p>
      </div>

      <div className="mt-2 flex gap-1.5">
        {days.map((day) => {
          const planned = day.meals.length > 0;
          return (
            <button
              key={day.date}
              onClick={() => onSelectDay(day.date)}
              aria-label={`${day.dayName}: ${planned ? "planned" : "not planned yet"}`}
              className={cn(
                "group flex min-h-touch flex-1 flex-col items-center justify-center gap-1 rounded-lg py-1 transition-all active:scale-95",
                day.isToday && "bg-white/60"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-bold uppercase",
                  day.isToday ? "text-accent" : "text-text-muted"
                )}
              >
                {day.shortName.slice(0, 2)}
              </span>
              <span
                className={cn(
                  "block h-2 w-full max-w-7 rounded-full transition-colors",
                  planned
                    ? complete
                      ? "bg-green"
                      : "bg-accent"
                    : "bg-border group-hover:bg-accent/40"
                )}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
});
