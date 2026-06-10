"use client";

import { useEffect } from "react";
import { useTour } from "./tour-context";
import { getInitialTourState } from "./tour-steps";

/**
 * Automatically starts the tour on first login if the user has never seen it.
 * This component should be rendered inside TourProvider.
 */
export function TourAutoStart() {
  const { startTour } = useTour();

  useEffect(() => {
    const saved = getInitialTourState();
    // Only start if user has never interacted with the tour
    // (not active, not completed, and no step index stored means fresh user)
    if (!saved.isActive && !saved.completed && saved.stepIndex === 0) {
      // Small delay to let the page render before showing the tour
      const timer = setTimeout(() => {
        startTour();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [startTour]);

  return null;
}
