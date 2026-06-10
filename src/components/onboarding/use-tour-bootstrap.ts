"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTour } from "./tour-context";
import { tourSteps, getInitialTourState } from "./tour-steps";

/**
 * Call this hook in every client page component that has tour targets.
 * It checks if there's an active tour whose current step belongs to this page,
 * and re-syncs the tour context state from localStorage.
 */
export function useTourBootstrap() {
  const pathname = usePathname();
  const { isActive, stepIndex, goToStep } = useTour();

  useEffect(() => {
    // Read from localStorage to handle cross-page navigation
    const saved = getInitialTourState();
    if (!saved.isActive || saved.completed) return;

    const step = tourSteps[saved.stepIndex];
    if (!step) return;

    const stepRoute = step.route ?? "/";
    if (stepRoute !== pathname) return;

    // If we're already showing the right step, nothing to do
    if (isActive && stepIndex === saved.stepIndex) return;

    // Small delay to let DOM settle before spotlight positions itself
    const timer = setTimeout(() => {
      goToStep(saved.stepIndex);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, isActive, stepIndex, goToStep]);
}
