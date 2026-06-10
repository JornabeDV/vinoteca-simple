"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
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
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TourState>(() => getInitialTourState());

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

  const nextStep = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex >= tourSteps.length) {
      closeTour();
      return;
    }
    persist(() => ({
      stepIndex: nextIndex,
      isActive: true,
      completed: false,
    }));
  }, [stepIndex, closeTour, persist]);

  const prevStep = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex < 0) return;
    persist(() => ({
      stepIndex: prevIndex,
      isActive: true,
      completed: false,
    }));
  }, [stepIndex, persist]);

  // Sync from localStorage on mount (for cross-tab sync)
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
      }}
    >
      {children}
    </TourContext.Provider>
  );
}
