"use client";

import { useEffect } from "react";

/**
 * Keep a shared household view current even when database-change delivery is
 * unavailable (for example, when Supabase RLS blocks an anonymous channel).
 */
export function useFamilyRefresh(refresh: () => void, intervalMs = 15_000) {
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    const interval = window.setInterval(refreshIfVisible, intervalMs);
    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [intervalMs, refresh]);
}
