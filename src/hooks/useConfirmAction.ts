"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Two-tap confirmation for destructive actions. The first call arms the
 * action (revealing a "Confirm" affordance); a second call within `timeout`
 * runs it. Auto-disarms after the timeout.
 *
 * Replaces the hand-rolled `confirm` boolean + setTimeout pattern that was
 * duplicated across Clear Week, Delete Dish and Leave Family.
 */
export function useConfirmAction(
  action: () => void | Promise<void>,
  timeout = 3000
) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  useEffect(() => clear, [clear]);

  const trigger = useCallback(async () => {
    if (armed) {
      clear();
      setArmed(false);
      await action();
    } else {
      setArmed(true);
      clear();
      timer.current = setTimeout(() => setArmed(false), timeout);
    }
  }, [armed, action, timeout, clear]);

  const reset = useCallback(() => {
    clear();
    setArmed(false);
  }, [clear]);

  return { armed, trigger, reset };
}
