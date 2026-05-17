"use client";

import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export function WeekNavigation({
  weekLabel,
  onPrev,
  onNext,
  onToday,
  onClearWeek,
  confirmClear,
}: {
  weekLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onClearWeek: () => void;
  confirmClear?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="p-2 rounded-lg text-text-secondary hover:bg-card-header transition-colors min-h-touch min-w-[44px] flex items-center justify-center"
          aria-label="Previous week"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-card-header transition-colors"
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
        <span>{confirmClear ? "Tap to confirm" : "Clear"}</span>
      </button>
    </div>
  );
}
