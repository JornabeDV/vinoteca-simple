"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  tourSteps,
  getInitialTourState,
  saveTourState,
  TourState,
} from "./tour-steps";

interface TourContextValue {
  isActive: boolean;
  stepIndex: number;
  currentStep: (typeof tourSteps)[number] | null;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  closeTour: () => void;
  goToStep: (index: number) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<TourState>(() => {
    // Only start automatically on first mount if never seen before
    const saved = getInitialTourState();
    // Don't auto-start here; let page.tsx decide based on auth
    return saved;
  });

  const isActive = state.isActive && !state.completed;
  const stepIndex = state.stepIndex;
  const currentStep = isActive ? tourSteps[stepIndex] ?? null : null;

  const persist = useCallback((updater: (prev: TourState) => TourState) => {
    setState((prev) => {
      const next = updater(prev);
      saveTourState(next);
      return next;
    });
  }, []);

  const startTour = useCallback(() => {
    persist(() => ({ stepIndex: 0, isActive: true, completed: false }));
  }, [persist]);

  const closeTour = useCallback(() => {
    persist(() => ({
      stepIndex: 0,
      isActive: false,
      completed: true,
    }));
  }, [persist]);

  const goToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= tourSteps.length) {
        closeTour();
        return;
      }
      const step = tourSteps[index];
      const currentRoute = step.route ?? pathname;

      persist(() => ({
        stepIndex: index,
        isActive: true,
        completed: false,
      }));

      // If step has a different route, navigate
      if (step.route && step.route !== pathname) {
        router.push(step.route);
      }
    },
    [closeTour, pathname, persist, router]
  );

  const nextStep = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex >= tourSteps.length) {
      closeTour();
      return;
    }
    goToStep(nextIndex);
  }, [stepIndex, closeTour, goToStep]);

  const prevStep = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex < 0) return;
    goToStep(prevIndex);
  }, [stepIndex, goToStep]);

  // Sync from localStorage on mount (for cross-page navigation)
  useEffect(() => {
    const handleStorage = () => {
      const saved = getInitialTourState();
      setState(saved);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <TourContext.Provider
      value={{
        isActive,
        stepIndex,
        currentStep,
        totalSteps: tourSteps.length,
        startTour,
        nextStep,
        prevStep,
        closeTour,
        goToStep,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}
