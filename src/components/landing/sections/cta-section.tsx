"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Wine, Shield, Clock, CreditCard } from "lucide-react";

export function CtaSection() {
  const router = useRouter();

  return (
    <section id="demo" className="py-20 lg:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#7b1f3a]/5 via-background to-[#7b1f3a]/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7b1f3a]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Empezá a gestionar tu vinoteca{" "}
            <span className="text-[#7b1f3a]">de forma más simple</span>
          </h2>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Solicitá una demo gratuita y descubrí cómo VinotecaSimple puede transformar tu negocio. Sin compromiso, sin tarjeta de crédito.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white px-10 h-14 text-base font-medium shadow-xl shadow-[#7b1f3a]/20"
                onClick={() => router.push("/registro")}
              >
                <Wine className="w-5 h-5 mr-2" />
                Solicitar demo gratuita
              </Button>
            </motion.div>
            <Button
              size="lg"
              variant="outline"
              className="border-[#7b1f3a] text-[#7b1f3a] hover:bg-[#7b1f3a]/5 px-10 h-14 text-base font-medium"
              onClick={() => router.push("/registro")}
            >
              Empezar prueba gratis
            </Button>
          </div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#7b1f3a]" />
              <span>Setup en 5 minutos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#7b1f3a]" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#7b1f3a]" />
              <span>Cancelás cuando querás</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
