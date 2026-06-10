"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$29.900",
    period: "/mes",
    description: "Perfecto para vinotecas que están empezando",
    features: [
      "Hasta 200 productos",
      "1 usuario",
      "Registro de ventas",
      "Control de stock básico",
      "Soporte por email",
    ],
    cta: "Empezar gratis",
    popular: false,
  },
  {
    name: "Pro",
    price: "$59.900",
    period: "/mes",
    description: "Para vinotecas que quieren crecer con datos",
    features: [
      "Productos ilimitados",
      "Hasta 5 usuarios",
      "Panel general de métricas",
      "Alertas de stock avanzadas",
      "Historial de movimientos",
      "Soporte prioritario",
    ],
    cta: "Empezar gratis",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Personalizado",
    period: "",
    description: "Para cadenas de vinotecas con necesidades específicas",
    features: [
      "Todo lo de Pro",
      "Usuarios ilimitados",
      "Múltiples sucursales",
      "API de integración",
      "Reportes personalizados",
      "Account manager dedicado",
    ],
    cta: "Contactar ventas",
    popular: false,
  },
];

export function PricingSection() {
  const router = useRouter();

  return (
    <section id="precios" className="py-20 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Precios simples, sin sorpresas
          </h2>
          <p className="mt-4 text-muted-foreground">
            Probá gratis por 14 días. Sin tarjeta de crédito. Cancelás cuando querás.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative bg-card rounded-2xl p-6 lg:p-8 border transition-all duration-300 ${
                plan.popular
                  ? "border-[#7b1f3a] shadow-xl shadow-[#7b1f3a]/10 md:scale-105"
                  : "border-border/50 hover:border-[#7b1f3a]/20 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7b1f3a] text-white text-xs font-semibold px-4 py-1 rounded-full">
                  Más popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="font-heading text-3xl font-bold text-foreground">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#7b1f3a]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#7b1f3a]" />
                    </div>
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full h-11 font-medium ${
                  plan.popular
                    ? "bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                }`}
                onClick={() => router.push("/registro")}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-xs text-muted-foreground mt-10"
        >
          Precios en pesos argentinos (ARS). IVA incluido. Podés pagar con tarjeta de crédito, débito o transferencia bancaria.
        </motion.p>
      </div>
    </section>
  );
}
