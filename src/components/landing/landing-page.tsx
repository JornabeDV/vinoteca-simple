"use client";

import { LandingNavbar } from "./landing-navbar";
import { LandingFooter } from "./landing-footer";
import { HeroSection } from "./sections/hero-section";
import { ProblemSection } from "./sections/problem-section";
import { SolutionSection } from "./sections/solution-section";
import { PricingSection } from "./sections/pricing-section";
import { ShowcaseSection } from "./sections/showcase-section";
import { BenefitsSection } from "./sections/benefits-section";
import { MetricsSection } from "./sections/metrics-section";
import { TestimonialsSection } from "./sections/testimonials-section";
import { FaqSection } from "./sections/faq-section";
import { CtaSection } from "./sections/cta-section";

export function LandingPage() {
  return (
    <div className="min-h-full bg-background">
      <LandingNavbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <PricingSection />
        <ShowcaseSection />
        <BenefitsSection />
        <MetricsSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
