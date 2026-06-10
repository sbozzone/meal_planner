"use client";

import { ChefHat } from "lucide-react";
import type { DinnerActivity } from "@/types/database";

export function ChefChip({ chef, onClick }: { chef: string | null; onClick: () => void }) {
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

export function formatActivityTime(activity: DinnerActivity) {
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
