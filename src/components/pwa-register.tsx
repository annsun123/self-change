"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then(
        (registration) => {
          console.log(
            "SW registered — scope:",
            registration.scope
          );
        },
        (err) => {
          console.log("SW registration skipped (dev or unsupported):", err.message);
        }
      );
  }, []);

  return null;
}
