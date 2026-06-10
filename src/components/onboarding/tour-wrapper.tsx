"use client";

import { ReactNode } from "react";
import { TourProvider } from "./tour-context";
import { TourOverlay } from "./tour-overlay";
import { TourAutoStart } from "./tour-auto-start";

export function TourClientWrapper({ children }: { children: ReactNode }) {
  return (
    <TourProvider>
      <TourOverlay />
      <TourAutoStart />
      {children}
    </TourProvider>
  );
}
