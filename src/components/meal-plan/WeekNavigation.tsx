"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WeekMode } from "@/hooks/useWeekNavigation";

export function WeekNavigation({
  weekLabel,
  mode,
  onToggleMode,
  onPrev,
  onNext,
  onClearWeek,
  confirmClear,
}: {
  weekLabel: string;
  mode: WeekMode;
  onToggleMode: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClearWeek: () => void;
  confirmClear?: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2.5">
      <div className="flex items-center gap-1.5">
        <div className="flex items-center rounded-full border border-border-light bg-card/70 p-0.5 shadow-warm-sm">
          <button
            onClick={onPrev}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-card-header hover:text-accent active:scale-90"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-[7.5rem] select-none px-1 text-center font-serif text-[15px] font-semibold text-text">
            {weekLabel}
          </span>
          <button
            onClick={onNext}
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-card-header hover:text-accent active:scale-90"
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center rounded-full border border-border-light bg-card/70 p-0.5 shadow-warm-sm">
          <button
            onClick={() => mode !== "7-day" && onToggleMode()}
            className={cn(
              "rounded-full px-2.5 py-1.5 text-xs font-bold transition-all",
              mode === "7-day"
                ? "bg-accent-gradient text-white shadow-warm-sm"
                : "text-text-muted hover:text-text"
            )}
          >
            7-day
          </button>
          <button
            onClick={() => mode !== "mon-sun" && onToggleMode()}
            className={cn(
              "rounded-full px-2.5 py-1.5 text-xs font-bold transition-all",
              mode === "mon-sun"
                ? "bg-accent-gradient text-white shadow-warm-sm"
                : "text-text-muted hover:text-text"
            )}
          >
            Mon–Sun
          </button>
        </div>
      </div>

      <button
        onClick={onClearWeek}
        className={cn(
          "flex min-h-touch items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition-all active:scale-95",
          confirmClear
            ? "bg-red text-white shadow-warm-sm"
            : "text-text-muted hover:bg-red/8 hover:text-red"
        )}
      >
        <RotateCcw className="h-4 w-4" />
        <span>{confirmClear ? "Confirm" : "Clear"}</span>
      </button>
    </div>
  );
}
