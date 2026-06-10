"use client";

import { motion } from "framer-motion";
import { DashboardMockup } from "../mockups/dashboard-mockup";
import { ProductsMockup } from "../mockups/products-mockup";
import { InventoryMockup } from "../mockups/inventory-mockup";
import { SalesMockup } from "../mockups/sales-mockup";
import { TrendingUp, Search, AlertTriangle, Zap } from "lucide-react";

const showcases = [
  {
    mockup: DashboardMockup,
    icon: TrendingUp,
    title: "Dashboard en tiempo real",
    description:
      "Tu negocio de un vistazo. Ventas del mes, ticket promedio, productos más vendidos y tendencias. Todo actualizado al instante sin tocar una sola planilla.",
  },
  {
    mockup: ProductsMockup,
    icon: Search,
    title: "Catálogo organizado y buscable",
    description:
      "Encontrá cualquier vino en segundos. Filtrá por bodega, varietal, precio o stock. Agregá nuevos productos en menos de un minuto.",
  },
  {
    mockup: InventoryMockup,
    icon: AlertTriangle,
    title: "Alertas de stock inteligentes",
    description:
      "Nunca más te quedes sin el vino que más vende. El sistema te avisa antes de que se agote y te ayuda a planificar las compras.",
  },
  {
    mockup: SalesMockup,
    icon: Zap,
    title: "Ventas rápidas y sin errores",
    description:
      "Registrá una venta en 3 clics. El stock se descuenta automáticamente. Al final del día tenés el cierre exacto sin sumar nada a mano.",
  },
];

export function ShowcaseSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Así de simple es usar VinotecaSimple
          </h2>
          <p className="mt-4 text-muted-foreground">
            Diseñado para que cualquier persona de tu equipo lo use sin entrenamiento.
          </p>
        </motion.div>

        <div className="space-y-20 lg:space-y-28">
          {showcases.map((item, i) => {
            const Mockup = item.mockup;
            const isReversed = i % 2 === 1;

            return (
              <div
                key={i}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                  isReversed ? "lg:flex-row-reverse" : ""
                }`}
              >
                <motion.div
                  initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className={isReversed ? "lg:order-2" : ""}
                >
                  <Mockup />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: isReversed ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={isReversed ? "lg:order-1" : ""}
                >
                  <div className="w-12 h-12 rounded-xl bg-[#7b1f3a]/10 flex items-center justify-center mb-5">
                    <item.icon className="w-6 h-6 text-[#7b1f3a]" />
                  </div>
                  <h3 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-4">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {item.description}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
