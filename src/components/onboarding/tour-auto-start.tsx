"use client";

import { useEffect } from "react";
import { useTour } from "./tour-context";
import { getInitialTourState } from "./tour-steps";
import { useIsClient } from "./use-is-client";

/**
 * Automatically starts the tour on first login if the user has never seen it.
 * This component should be rendered inside TourProvider.
 */
export function TourAutoStart() {
  const isClient = useIsClient();
  const { startTour } = useTour();

  useEffect(() => {
    if (!isClient) return;
    const saved = getInitialTourState();
    // Only start if user has never interacted with the tour
    if (!saved.isActive && !saved.completed && saved.stepIndex === 0) {
      const timer = setTimeout(() => {
        startTour();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [startTour, isClient]);

  return null;
}
