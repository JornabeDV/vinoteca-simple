"use client";

import { useEffect } from "react";
import { useTour } from "./tour-context";
import { getInitialTourState } from "./tour-steps";

/**
 * Re-syncs tour state from localStorage on mount.
 * Useful if the tour was started in another tab.
 */
export function useTourBootstrap() {
  const { isActive, stepIndex, startTour } = useTour();

  useEffect(() => {
    const saved = getInitialTourState();
    if (saved.isActive && !saved.completed && saved.stepIndex !== stepIndex) {
      // Tour is active from another tab/session
      startTour();
    }
  }, [stepIndex, isActive, startTour]);
}
