"use client";

import { useState, useCallback } from "react";
import { getWeekStart, formatWeekLabel } from "@/lib/utils";
import { addDays, parseISO, format } from "date-fns";

export type WeekMode = "7-day" | "mon-sun";

export function useWeekNavigation() {
  const [mode, setMode] = useState<WeekMode>("mon-sun");
  const [weekStart, setWeekStart] = useState(() => getWeekStart());

  const weekLabel = formatWeekLabel(weekStart);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      if (prev === "mon-sun") {
        setWeekStart(format(new Date(), "yyyy-MM-dd"));
        return "7-day";
      } else {
        setWeekStart((current) => getWeekStart(parseISO(current)));
        return "mon-sun";
      }
    });
  }, []);

  const goToPrevWeek = useCallback(() => {
    setWeekStart((prev) => format(addDays(parseISO(prev), -7), "yyyy-MM-dd"));
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekStart((prev) => format(addDays(parseISO(prev), 7), "yyyy-MM-dd"));
  }, []);

  const goToToday = useCallback(() => {
    setWeekStart(
      mode === "mon-sun" ? getWeekStart() : format(new Date(), "yyyy-MM-dd")
    );
  }, [mode]);

  return { weekStart, weekLabel, mode, toggleMode, goToPrevWeek, goToNextWeek, goToToday };
}
