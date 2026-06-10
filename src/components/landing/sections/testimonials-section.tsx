"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "María López",
    role: "Dueña",
    shop: "Vinoteca El Buen Sabor",
    location: "San Juan",
    text: "Antes usábamos un cuaderno y una planilla de Excel que se rompía cada dos semanas. Con Vinoteca Simple todo está ordenado, sé exactamente cuánto vendo por día y qué me queda en stock. Lo mejor es que mi empleado lo usa sin que yo tenga que explicarle nada.",
    rating: 5,
    initials: "ML",
  },
  {
    name: "Carlos Mendoza",
    role: "Propietario",
    shop: "Cava de Autor",
    location: "Mendoza",
    text: "Probé tres sistemas distintos antes de encontrar Vinoteca Simple. Los otros eran complicados y caros. Este es justo lo que necesitaba: simple, rápido y con los números que me importan. En una semana ya sabía más de mi negocio que en los últimos dos años.",
    rating: 5,
    initials: "CM",
  },
  {
    name: "Laura Fernández",
    role: "Gerente",
    shop: "Terroir Wines",
    location: "Córdoba",
    text: "La alerta de stock bajo me salvó varias veces. Antes se me agotaban los vinos más vendidos y no me enteraba hasta que un cliente me lo decía. Ahora compro antes de que pase. El dashboard de ventas me ayudó a entender qué bodegas me dejan más margen.",
    rating: 5,
    initials: "LF",
  },
];

export function TestimonialsSection() {
  return (
    <section id="testimonios" className="py-20 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Lo que dicen los dueños de vinotecas
          </h2>
          <p className="mt-4 text-muted-foreground">
            Más de 120 vinotecas argentinas ya administran su negocio con nosotros.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border/50 rounded-2xl p-6 lg:p-8 hover:shadow-lg transition-shadow relative"
            >
              <Quote className="w-8 h-8 text-[#7b1f3a]/10 absolute top-6 right-6" />

              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{t.text}</p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#7b1f3a] flex items-center justify-center text-white text-xs font-semibold">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.role} · {t.shop} · {t.location}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
