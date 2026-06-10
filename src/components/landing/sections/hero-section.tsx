"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DashboardMockup } from "../mockups/dashboard-mockup";
import { Wine, Star, Users } from "lucide-react";

export function HeroSection() {
  const router = useRouter();

  const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#faf9f7] via-white to-[#faf9f7] pointer-events-none" />
      <div className="absolute top-20 -right-32 sm:right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#7b1f3a]/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-32 sm:bottom-0 sm:left-0 w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-[#7b1f3a]/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="text-center lg:text-left">
            {/* Social proof badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-[#7b1f3a]/5 border border-[#7b1f3a]/10 rounded-full px-4 py-1.5 mb-6"
            >
              <Users className="w-3.5 h-3.5 text-[#7b1f3a]" />
              <span className="text-xs font-medium text-[#7b1f3a]">
                +120 vinotecas ya confían en nosotros
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]"
            >
              Administrá tu vinoteca{" "}
              <span className="text-[#7b1f3a]">sin planillas ni complicaciones</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0"
            >
              Controlá stock, registrá ventas y seguí el rendimiento de tu negocio desde una sola plataforma.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Button
                size="lg"
                className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white px-8 h-12 text-base font-medium shadow-lg shadow-[#7b1f3a]/20"
                onClick={() => router.push("/registro")}
              >
                <Wine className="w-4 h-4 mr-2" />
                Empezar gratis
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#7b1f3a] text-[#7b1f3a] hover:bg-[#7b1f3a]/5 px-8 h-12 text-base font-medium"
                onClick={() => scrollTo("#funcionalidades")}
              >
                Ver funcionalidades
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 justify-center lg:justify-start text-xs text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">4.9</span>
                <span>de calificación</span>
              </div>
              <div className="w-px h-4 bg-border hidden sm:block" />
              <div>Prueba gratis 14 días</div>
              <div className="w-px h-4 bg-border hidden sm:block" />
              <div>Sin tarjeta de crédito</div>
            </motion.div>
          </div>

          {/* Mockup */}
          <div className="relative">
            <DashboardMockup />
            {/* Decorative blur behind */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#7b1f3a]/10 to-transparent rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
