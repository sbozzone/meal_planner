"use client";

import { ThumbsDown, ThumbsUp, X } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { cn, getMealEmoji } from "@/lib/utils";
import { useDeviceId } from "@/hooks/useDeviceId";
import { FUN_OPTIONS } from "@/types/database";
import type { MealPlan } from "@/types/database";

export const MealChip = memo(function MealChip({
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
