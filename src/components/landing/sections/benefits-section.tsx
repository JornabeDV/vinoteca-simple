"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const benefits = [
  {
    title: "Control total del negocio",
    description: "Sabés en todo momento qué tenés, qué vendiste y cuánto ganaste. Nada queda en el aire.",
  },
  {
    title: "Menos errores de stock",
    description: "Las alertas automáticas evitan que te quedes sin producto o que compres de más. Stock justo, siempre.",
  },
  {
    title: "Información en tiempo real",
    description: "Cada venta, ajuste o movimiento se refleja instantáneamente. Tu negocio no espera.",
  },
  {
    title: "Decisiones basadas en datos",
    description: "Dejá de adivinar. Las métricas te dicen qué vende más, cuándo reponer y cuál es tu margen real.",
  },
  {
    title: "Plataforma fácil de usar",
    description: "Diseñada para que cualquiera en tu equipo la use sin manual ni capacitación. Si sabés usar WhatsApp, sabés usar esto.",
  },
];

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-20 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Menos tiempo administrando.{" "}
            <span className="text-[#7b1f3a]">Más tiempo vendiendo.</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {benefits.map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`bg-card border border-border/50 rounded-2xl p-6 hover:shadow-md transition-shadow ${
                i === 4 ? "sm:col-span-2 lg:col-span-1" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#7b1f3a]/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-5 h-5 text-[#7b1f3a]" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
