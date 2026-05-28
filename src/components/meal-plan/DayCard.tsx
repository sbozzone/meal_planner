"use client";

import { CalendarClock, Plus, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn, getMealEmoji } from "@/lib/utils";
import { FUN_OPTIONS } from "@/types/database";
import type { DayPlan, DinnerActivity, MealPlan } from "@/types/database";

const TODAY = new Date().toISOString().split("T")[0];

export function DayCard({
  day,
  onTapToAssign,
  onAddActivity,
  onEditActivity,
  onRemoveMeal,
  familyId,
}: {
  day: DayPlan;
  onTapToAssign: (date: string) => void;
  onAddActivity: (date: string) => void;
  onEditActivity: (activity: DinnerActivity) => void;
  onRemoveMeal: (mealId: string) => void;
  familyId: string;
}) {
  const mainMeal = day.meals[0] ?? null;
  const sideMeals = day.meals.slice(1);
  const activities = day.activities ?? [];
  const isPast = day.date < TODAY;
  const isWeekend = ["Saturday", "Sunday"].includes(day.dayName);
  const fullyEmpty = day.meals.length === 0 && activities.length === 0;

  return (
    <div
      className={cn(
        "rounded-card border-l-4 border border-r border-t border-b transition-colors overflow-hidden",
        day.isToday
          ? "border-l-accent border-accent/30 bg-accent-light/50"
          : isPast
          ? "border-l-border bg-card-header/70 border-border-light"
          : isWeekend
          ? "border-l-blue/40 bg-card border-border-light"
          : "border-l-accent/40 bg-card border-border-light"
      )}
    >
      {/* Day header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-light/50">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "font-semibold text-base",
              day.isToday
                ? "text-accent"
                : isPast
                ? "text-text-muted"
                : "text-text"
            )}
          >
            {day.dayName}
          </span>
          <span
            className={cn(
              "text-sm font-medium",
              isPast ? "text-text-muted/70" : "text-text-muted"
            )}
          >
            {day.dayNumber}
          </span>
          {isWeekend && !day.isToday && (
            <span className="text-[10px] font-semibold text-blue/80 bg-blue/10 px-1.5 py-0.5 rounded-full">
              {day.shortName}
            </span>
          )}
        </div>
        {day.isToday && (
          <span className="text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded-full uppercase tracking-wider">
            Today
          </span>
        )}
      </div>

      <div className="p-3">
        {/* Meals */}
        {mainMeal && (
          <MealChip meal={mainMeal} onRemove={onRemoveMeal} familyId={familyId} isMain />
        )}
        {sideMeals.length > 0 && (
          <div className="mt-1.5 pl-2 space-y-1 border-l-2 border-border-light">
            {sideMeals.map((meal) => (
              <MealChip key={meal.id} meal={meal} onRemove={onRemoveMeal} familyId={familyId} />
            ))}
          </div>
        )}

        {/* Activities */}
        {activities.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {activities.map((activity) => (
              <button
                key={activity.id}
                className="flex w-full items-start gap-2 rounded-lg border border-blue/20 bg-blue/10 px-3 py-2 text-left text-sm text-text-secondary hover:bg-blue/15 transition-colors"
                type="button"
                onClick={() => onEditActivity(activity)}
              >
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-text">
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

        {/* Action buttons */}
        <div className={cn("mt-2 grid gap-2", fullyEmpty ? "grid-cols-1" : "grid-cols-2")}>
          {/* Dinner button */}
          {fullyEmpty ? (
            <button
              onClick={() => onTapToAssign(day.date)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl transition-colors min-h-[72px]",
                isPast
                  ? "bg-card-header text-text-muted hover:text-text-secondary"
                  : "bg-accent-light/60 text-accent-dark hover:bg-accent-light"
              )}
            >
              <span className="text-2xl leading-none">🍽️</span>
              <span className="text-sm font-medium">
                {isPast ? "Add dinner" : "What's cooking?"}
              </span>
              {!isPast && (
                <span className="text-[11px] text-text-muted">Free night? Takeout?</span>
              )}
            </button>
          ) : (
            <button
              onClick={() => onTapToAssign(day.date)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-card-header hover:bg-border text-text-secondary hover:text-accent transition-colors min-h-touch py-1 text-sm font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              {day.meals.length === 0 ? "Add dinner" : "Add side"}
            </button>
          )}

          {/* Activity button */}
          {!fullyEmpty && (
            <button
              onClick={() => onAddActivity(day.date)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-card-header hover:bg-blue/10 text-text-secondary hover:text-blue transition-colors min-h-touch py-1 text-sm font-medium"
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Add activity
            </button>
          )}
        </div>

        {/* Add activity link for fully-empty days */}
        {fullyEmpty && (
          <button
            onClick={() => onAddActivity(day.date)}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-blue transition-colors py-1.5"
          >
            <CalendarClock className="h-3.5 w-3.5" />
            Add activity
          </button>
        )}
      </div>
    </div>
  );
}

function MealChip({
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
  const [deviceId, setDeviceId] = useState("");
  const [voteCount, setVoteCount] = useState(meal.vote_count || 0);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);

  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

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
        "flex items-center gap-2 rounded-xl px-3 shadow-sm",
        isMain
          ? "bg-accent-light text-accent-dark py-3 border border-accent/20"
          : "bg-card text-text-secondary border border-border-light py-2"
      )}
    >
      {!isMain && (
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider shrink-0">
          Side
        </span>
      )}
      <span
        className={cn(
          "flex-1 flex items-center gap-1.5 min-w-0 font-semibold",
          isMain ? "text-base text-accent-dark" : "text-sm text-text"
        )}
      >
        {mealEmoji && <span className="text-base leading-none shrink-0">{mealEmoji}</span>}
        <span className="truncate">{name}</span>
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVote(1);
          }}
          className={cn(
            "min-h-touch min-w-[44px] rounded-lg px-2 flex items-center justify-center gap-1 text-xs font-semibold transition-colors",
            userVote === 1
              ? "bg-accent text-white"
              : "bg-white/60 text-accent-dark hover:bg-accent-light"
          )}
          aria-label={`Upvote ${name}`}
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          {voteCount !== 0 && <span>{voteCount}</span>}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleVote(-1);
          }}
          className={cn(
            "min-h-touch min-w-[44px] rounded-lg px-2 flex items-center justify-center transition-colors",
            userVote === -1
              ? "bg-red text-white"
              : "bg-white/60 text-text-secondary hover:bg-card-header"
          )}
          aria-label={`Downvote ${name}`}
        >
          <ThumbsDown className="w-3.5 h-3.5" />
        </button>
      </div>
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

function getDeviceId() {
  if (typeof window === "undefined") return "server";
  const key = "family-dinnertime-device-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

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
