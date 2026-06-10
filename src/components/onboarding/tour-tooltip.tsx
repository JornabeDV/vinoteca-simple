"use client";

import { ArrowRight, ArrowLeft, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTour } from "./tour-context";

interface TourTooltipProps {
  top: number;
  left: number;
  placement: "top" | "bottom" | "left" | "right" | "center";
  visible: boolean;
}

export function TourTooltip({ top, left, placement, visible }: TourTooltipProps) {
  const {
    currentStep,
    stepIndex,
    totalSteps,
    nextStep,
    prevStep,
    closeTour,
  } = useTour();

  if (!currentStep) return null;

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const isCenter = placement === "center";

  return (
    <div
      className={`absolute z-[101] w-[min(360px,92vw)] transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"
      } ${isCenter ? "fixed" : ""}`}
      style={{
        top: isCenter ? "50%" : top,
        left: isCenter ? "50%" : left,
        transform: isCenter
          ? `translate(-50%, -50%) ${visible ? "scale(1)" : "scale(0.95)"}`
          : undefined,
      }}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header with wine brand color */}
        <div className="bg-[#7b1f3a] px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-white/80" />
            <h3 className="font-heading text-base font-semibold text-white">
              {currentStep.title}
            </h3>
          </div>
          <button
            onClick={closeTour}
            className="text-white/60 hover:text-white transition-colors p-0.5"
            aria-label="Cerrar tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/30 flex items-center justify-between gap-3">
          {/* Step counter */}
          <span className="text-xs text-muted-foreground">
            {stepIndex + 1} de {totalSteps}
          </span>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button
                variant="ghost"
                size="sm"
                onClick={prevStep}
                className="gap-1 text-xs"
              >
                <ArrowLeft className="h-3 w-3" />
                Anterior
              </Button>
            )}

            {isLast ? (
              <Button
                size="sm"
                onClick={closeTour}
                className="gap-1 text-xs bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
              >
                Finalizar
                <Sparkles className="h-3 w-3" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={nextStep}
                className="h-8 gap-1 text-xs bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
              >
                {isFirst ? "Empezar" : "Siguiente"}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
