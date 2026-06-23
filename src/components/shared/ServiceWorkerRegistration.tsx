"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive enhancement; the app remains usable
      // online if registration is unavailable.
    });
  }, []);

  return null;
}
