"use client";

import { motion } from "framer-motion";
import { Wine, Package, ShoppingCart, BarChart3, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Wine,
    title: "Gestión de productos",
    description: "Catalogá todos tus vinos con bodega, varietal, precio y fotos. Encontrá cualquier producto en segundos.",
  },
  {
    icon: Package,
    title: "Control de stock",
    description: "Sabés exactamente cuánto tenés de cada producto. Alertas automáticas cuando el stock está bajo.",
  },
  {
    icon: ShoppingCart,
    title: "Registro de ventas",
    description: "Registrá ventas en segundos desde cualquier dispositivo. El stock se actualiza automáticamente.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de métricas",
    description: "Visualizá ventas, productos más vendidos, margen de ganancia y tendencias en tiempo real.",
  },
];

export function SolutionSection() {
  return (
    <section id="funcionalidades" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Todo lo que necesitás para administrar tu vinoteca
          </h2>
          <p className="mt-4 text-muted-foreground">
            Un sistema completo que reemplaza planillas, papeles y la memoria. Todo en un solo lugar.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-card border border-border/50 rounded-2xl p-6 hover:shadow-lg hover:border-[#7b1f3a]/20 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#7b1f3a]/10 flex items-center justify-center mb-5 group-hover:bg-[#7b1f3a] transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-[#7b1f3a] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{feature.description}</p>
              <div className="flex items-center gap-1 text-xs font-medium text-[#7b1f3a] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span>Ver más</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
