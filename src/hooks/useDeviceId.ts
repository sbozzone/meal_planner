"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "family-dinnertime-device-id";

function readOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(STORAGE_KEY, next);
  return next;
}

/**
 * Stable per-device identifier used to attribute meal votes. Lives in
 * localStorage; resolves to an empty string during SSR and on first paint,
 * then populates after mount.
 */
export function useDeviceId(): string {
  const [deviceId, setDeviceId] = useState("");
  useEffect(() => {
    setDeviceId(readOrCreateDeviceId());
  }, []);
  return deviceId;
}
