"use client";

import { CalendarClock, ChefHat, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { cn, getMealEmoji } from "@/lib/utils";
import { useDeviceId } from "@/hooks/useDeviceId";
import { FUN_OPTIONS } from "@/types/database";
import type { DayPlan, DinnerActivity, MealPlan } from "@/types/database";

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

function ChefChip({ chef, onClick }: { chef: string | null; onClick: () => void }) {
  if (chef) {
    return (
      <button
        onClick={onClick}
        className="flex shrink-0 items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 text-[11px] font-semibold text-gold transition-colors hover:border-gold/50"
      >
        <ChefHat className="h-3 w-3" />
        <span className="max-w-[5rem] truncate">{chef}</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-gold/10 hover:text-gold"
      aria-label="Assign a chef"
    >
      <ChefHat className="h-4 w-4" />
    </button>
  );
}

const MealChip = memo(function MealChip({
  meal,
  onRemove,
  familyId,
  isMain = false,
}: {
  meal: MealPlan;
  onRemove: (id: string) => void;
  familyId: string;
  isMain?: boolean;
}) {
  const name = meal.dish?.name || meal.custom_name || "Unknown dish";
  const funOption = FUN_OPTIONS.find((o) => o.label === name);
  const mealEmoji = funOption ? funOption.emoji : getMealEmoji(name);
  const deviceId = useDeviceId();
  const [voteCount, setVoteCount] = useState(meal.vote_count || 0);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);

  useEffect(() => {
    setVoteCount(meal.vote_count || 0);
    if (deviceId) {
      setUserVote((meal.votes || {})[deviceId] || null);
    }
  }, [deviceId, meal.vote_count, meal.votes]);

  async function handleVote(value: 1 | -1) {
    if (!deviceId) return;
    const removing = userVote === value;
    const optimisticVote = removing ? null : value;
    const optimisticCount =
      voteCount - (userVote || 0) + (optimisticVote || 0);

    setUserVote(optimisticVote);
    setVoteCount(optimisticCount);

    const res = await fetch(
      removing
        ? `/api/meal-plan/${meal.id}/vote?deviceId=${encodeURIComponent(deviceId)}`
        : `/api/meal-plan/${meal.id}/vote`,
      {
        method: removing ? "DELETE" : "POST",
        headers: removing
          ? { "x-family-id": familyId }
          : { "x-family-id": familyId, "Content-Type": "application/json" },
        body: removing ? undefined : JSON.stringify({ voteValue: value, deviceId }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      setVoteCount(data.voteCount);
      setUserVote(data.userVote);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl",
        isMain
          ? "border border-accent/20 bg-accent-light px-3 py-2.5 shadow-hairline"
          : "border border-border-light bg-paper/70 px-3 py-2"
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg",
          isMain ? "h-9 w-9 bg-white/70 text-xl" : "h-7 w-7 bg-card-header text-base"
        )}
      >
        {mealEmoji || "🍴"}
      </span>
      <div className="min-w-0 flex-1">
        {!isMain && (
          <span className="block text-[9px] font-bold uppercase tracking-wider text-text-muted">
            Side
          </span>
        )}
        <span
          className={cn(
            "block truncate font-semibold",
            isMain ? "text-[15px] text-accent-dark" : "text-sm text-text"
          )}
        >
          {name}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVote(1);
          }}
          className={cn(
            "flex min-h-touch min-w-[42px] items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold transition-colors active:scale-95",
            userVote === 1
              ? "bg-accent text-white shadow-warm-sm"
              : "bg-white/70 text-accent-dark hover:bg-white"
          )}
          aria-label={`Upvote ${name}`}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
          {voteCount !== 0 && <span>{voteCount}</span>}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVote(-1);
          }}
          className={cn(
            "flex min-h-touch min-w-[42px] items-center justify-center rounded-lg px-2 transition-colors active:scale-95",
            userVote === -1
              ? "bg-red text-white shadow-warm-sm"
              : "bg-white/70 text-text-secondary hover:bg-white"
          )}
          aria-label={`Downvote ${name}`}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(meal.id);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-black/5 hover:text-red"
          aria-label={`Remove ${name}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
});

function formatActivityTime(activity: DinnerActivity) {
  const start = formatTime(activity.start_time);
  const end = formatTime(activity.end_time);

  if (start && end) return `${start}–${end}`;
  if (start) return start;
  if (end) return `until ${end}`;
  return "Dinner impact";
}

function formatTime(value: string | null) {
  if (!value) return "";
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteText ?? "00"} ${suffix}`;
}
