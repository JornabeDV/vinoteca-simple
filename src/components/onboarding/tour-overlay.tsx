"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "./tour-context";
import { TourTooltip } from "./tour-tooltip";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay() {
  const { isActive, currentStep, closeTour } = useTour();
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom" | "left" | "right" | "center";
  }>({ top: 0, left: 0, placement: "center" });
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isCenter = currentStep?.target === "center";

  const calculatePositions = useCallback(() => {
    if (!isActive || !currentStep) return;

    if (isCenter) {
      setTargetRect(null);
      setTooltipPos({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        placement: "center",
      });
      return;
    }

    const target = document.querySelector(currentStep.target);
    if (!target) {
      // Target not found, show centered tooltip with warning
      setTargetRect(null);
      setTooltipPos({
        top: window.innerHeight / 2,
        left: window.innerWidth / 2,
        placement: "center",
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = 8;
    const spotlightRect: Rect = {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    };
    setTargetRect(spotlightRect);

    // Calculate tooltip position
    const tooltipWidth = 360;
    const tooltipHeight = 200;
    const gap = 16;
    let placement: "top" | "bottom" | "left" | "right" = "bottom";
    let top = 0;
    let left = 0;

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // On mobile (< 1024), always center-bottom
    if (viewportW < 1024) {
      placement = "bottom";
      top = Math.min(
        spotlightRect.top + spotlightRect.height + gap,
        viewportH - tooltipHeight - 20
      );
      left = Math.max(
        16,
        Math.min(
          viewportW / 2 - tooltipWidth / 2,
          viewportW - tooltipWidth - 16
        )
      );
    } else {
      // Use requested placement with fallback
      const requested = currentStep.placement;

      const fitsBelow =
        spotlightRect.top + spotlightRect.height + gap + tooltipHeight <
        viewportH;
      const fitsAbove = spotlightRect.top - gap - tooltipHeight > 0;
      const fitsRight =
        spotlightRect.left + spotlightRect.width + gap + tooltipWidth <
        viewportW;
      const fitsLeft = spotlightRect.left - gap - tooltipWidth > 0;

      if (requested === "bottom" && fitsBelow) placement = "bottom";
      else if (requested === "top" && fitsAbove) placement = "top";
      else if (requested === "right" && fitsRight) placement = "right";
      else if (requested === "left" && fitsLeft) placement = "left";
      else if (fitsBelow) placement = "bottom";
      else if (fitsAbove) placement = "top";
      else if (fitsRight) placement = "right";
      else placement = "left";

      switch (placement) {
        case "bottom":
          top = spotlightRect.top + spotlightRect.height + gap;
          left = Math.max(
            16,
            Math.min(
              spotlightRect.left + spotlightRect.width / 2 - tooltipWidth / 2,
              viewportW - tooltipWidth - 16
            )
          );
          break;
        case "top":
          top = spotlightRect.top - gap - tooltipHeight;
          left = Math.max(
            16,
            Math.min(
              spotlightRect.left + spotlightRect.width / 2 - tooltipWidth / 2,
              viewportW - tooltipWidth - 16
            )
          );
          break;
        case "right":
          top = Math.max(
            16,
            Math.min(
              spotlightRect.top + spotlightRect.height / 2 - tooltipHeight / 2,
              viewportH - tooltipHeight - 16
            )
          );
          left = spotlightRect.left + spotlightRect.width + gap;
          break;
        case "left":
          top = Math.max(
            16,
            Math.min(
              spotlightRect.top + spotlightRect.height / 2 - tooltipHeight / 2,
              viewportH - tooltipHeight - 16
            )
          );
          left = spotlightRect.left - gap - tooltipWidth;
          break;
      }
    }

    setTooltipPos({ top, left, placement });
  }, [isActive, currentStep, isCenter]);

  // Calculate on step change
  useEffect(() => {
    if (!isActive || !currentStep) return;

    // Scroll target into view first
    if (!isCenter && currentStep.target) {
      const el = document.querySelector(currentStep.target);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    // Wait for scroll to settle before calculating positions
    const timer = setTimeout(() => {
      calculatePositions();
    }, 400);

    return () => clearTimeout(timer);
  }, [isActive, currentStep, isCenter, calculatePositions]);

  // Recalculate on resize
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => calculatePositions();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isActive, calculatePositions]);

  // Escape to close
  useEffect(() => {
    if (!isActive) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTour();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isActive, closeTour]);

  // Lock body scroll
  useEffect(() => {
    if (isActive) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isActive]);

  if (!isActive || !currentStep) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100]"
      >
        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-black/70"
          onClick={closeTour}
          aria-hidden="true"
        />

        {/* Spotlight hole */}
        {targetRect && (
          <motion.div
            initial={false}
            animate={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
            }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute rounded-lg"
            style={{
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.7)",
              pointerEvents: "none",
            }}
          >
            {/* Pulse ring around spotlight */}
            <div className="absolute -inset-2 rounded-xl border-2 border-[#7b1f3a]/60 animate-pulse" />
          </motion.div>
        )}

        {/* Tooltip */}
        <TourTooltip
          top={tooltipPos.top}
          left={tooltipPos.left}
          placement={tooltipPos.placement}
        />
      </motion.div>
    </AnimatePresence>
  );
}
