"use client";

import { ReactNode } from "react";
import { TourProvider } from "./tour-context";
import { TourOverlay } from "./tour-overlay";
import { TourAutoStart } from "./tour-auto-start";

interface TourClientWrapperProps {
  children: ReactNode;
  userRole?: string;
}

export function TourClientWrapper({ children, userRole }: TourClientWrapperProps) {
  // Skip tour entirely for admin users
  if (userRole === "ADMIN") {
    return <>{children}</>;
  }

  return (
    <TourProvider>
      <TourOverlay />
      <TourAutoStart />
      {children}
    </TourProvider>
  );
}
