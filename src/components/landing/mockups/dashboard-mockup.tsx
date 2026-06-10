"use client";

import { motion } from "framer-motion";
import { TrendingUp, Package, ShoppingCart, DollarSign } from "lucide-react";

export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
        {/* Header mock */}
        <div className="h-12 bg-[#7b1f3a] flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/30" />
            <div className="w-3 h-3 rounded-full bg-white/30" />
            <div className="w-3 h-3 rounded-full bg-white/30" />
          </div>
          <div className="ml-4 text-white/80 text-xs font-medium">Panel general</div>
        </div>

        {/* KPIs */}
        <div className="p-4 sm:p-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: "Ventas del mes", value: "$1.245.000", icon: DollarSign, trend: "+12%" },
            { label: "Productos", value: "142", icon: Package, trend: "+3" },
            { label: "Ventas hoy", value: "23", icon: ShoppingCart, trend: "+5" },
            { label: "Ticket promedio", value: "$54.200", icon: TrendingUp, trend: "+8%" },
          ].map((kpi, i) => (
            <div key={i} className="bg-muted/50 rounded-xl p-4 border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-4 h-4 text-[#7b1f3a]" />
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  {kpi.trend}
                </span>
              </div>
              <div className="font-heading text-sm sm:text-lg font-bold text-foreground truncate">{kpi.value}</div>
              <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* Chart area */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="bg-muted/30 rounded-xl p-3 sm:p-4 border border-border/40">
            <div className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-3 sm:mb-4">Tendencia de ventas</div>
            <div className="flex items-end gap-1 sm:gap-2 h-20 sm:h-28">
              {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 55].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[#7b1f3a] rounded-t"
                  style={{ height: `${h}%`, opacity: 0.7 + (i % 3) * 0.1 }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[9px] text-muted-foreground">
              <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
