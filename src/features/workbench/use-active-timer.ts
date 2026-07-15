"use client";

import { useCallback, useEffect, useRef } from "react";
import { ActiveTimer } from "./active-timer";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "input", "wheel"] as const;

export function useActiveTimer(scopeKey: string) {
  const timerRef = useRef(new ActiveTimer());

  useEffect(() => {
    timerRef.current = new ActiveTimer();
  }, [scopeKey]);

  useEffect(() => {
    const timer = timerRef.current;
    const markActivity = () => timer.recordActivity();
    const handleVisibilityChange = () => {
      if (document.hidden) {
        timer.pause();
      } else {
        timer.resume();
      }
    };
    const handleBlur = () => timer.pause();
    const handleFocus = () => timer.resume();

    for (const eventName of ACTIVITY_EVENTS) {
      document.addEventListener(eventName, markActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        document.removeEventListener(eventName, markActivity);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [scopeKey]);

  const getActiveSeconds = useCallback(
    () => timerRef.current.elapsedSeconds(),
    [],
  );
  const resetActiveTimer = useCallback(() => timerRef.current.reset(), []);

  return { getActiveSeconds, resetActiveTimer };
}
