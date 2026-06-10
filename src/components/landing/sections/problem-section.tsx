"use client";

import { motion } from "framer-motion";
import { FileSpreadsheet, AlertTriangle, BarChart3, ShoppingCart, FolderOpen } from "lucide-react";

const problems = [
  {
    icon: AlertTriangle,
    title: "Stock desactualizado",
    description: "Nunca sabés con exactitud qué productos tenés ni cuántos. Se vende lo que no hay y queda lo que no se vende.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: FileSpreadsheet,
    title: "Planillas difíciles de mantener",
    description: "Excel se vuelve un laberinto de fórmulas rotas, versiones duplicadas y errores humanos constantes.",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
  },
  {
    icon: BarChart3,
    title: "Falta de métricas claras",
    description: "No tenés visibilidad de qué vende más, cuándo reponer ni cuál es la rentabilidad real de cada producto.",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-100",
  },
  {
    icon: ShoppingCart,
    title: "Ventas sin control",
    description: "Cada venta se anota a mano o se olvida. Al final del día no sabés cuánto vendiste ni qué te queda.",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
  {
    icon: FolderOpen,
    title: "Información dispersa",
    description: "Los datos están en papeles, planillas, WhatsApp y memoria. Nada está en un solo lugar.",
    color: "text-stone-600",
    bg: "bg-stone-50",
    border: "border-stone-100",
  },
];

export function ProblemSection() {
  return (
    <section className="py-20 lg:py-28 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            ¿Te resulta familiar esta situación?
          </h2>
          <p className="mt-4 text-muted-foreground">
            La mayoría de las vinotecas argentinas siguen administrando su negocio como hace 20 años.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`${problem.bg} border ${problem.border} rounded-2xl p-6 hover:shadow-md transition-shadow`}
            >
              <div className={`w-10 h-10 rounded-xl ${problem.bg} border ${problem.border} flex items-center justify-center mb-4`}>
                <problem.icon className={`w-5 h-5 ${problem.color}`} />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-2">{problem.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
