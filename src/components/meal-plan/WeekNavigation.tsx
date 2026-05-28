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
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg text-text-secondary hover:bg-card-header transition-colors min-h-touch min-w-[44px] flex items-center justify-center"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          className="px-2 py-1.5 rounded-lg text-sm font-medium text-text cursor-default select-none"
          tabIndex={-1}
          aria-label="Current week range"
        >
          {weekLabel}
        </button>

        <button
          onClick={onNext}
          className="p-2 rounded-lg text-text-secondary hover:bg-card-header transition-colors min-h-touch min-w-[44px] flex items-center justify-center"
          aria-label="Next week"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div className="ml-1 flex items-center rounded-full border border-border bg-card-header p-0.5">
          <button
            onClick={() => mode !== "7-day" && onToggleMode()}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
              mode === "7-day"
                ? "bg-accent text-white"
                : "text-text-muted hover:text-text"
            )}
          >
            7-day
          </button>
          <button
            onClick={() => mode !== "mon-sun" && onToggleMode()}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold transition-colors",
              mode === "mon-sun"
                ? "bg-accent text-white"
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
          "flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors min-h-touch",
          confirmClear
            ? "text-white bg-red"
            : "text-text-muted hover:text-red hover:bg-red/5"
        )}
      >
        <RotateCcw className="w-4 h-4" />
        <span>{confirmClear ? "Confirm" : "Clear"}</span>
      </button>
    </div>
  );
}
