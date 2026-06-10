"use client";

import { motion } from "framer-motion";
import { AlertTriangle, PackageCheck, TrendingDown } from "lucide-react";

export function InventoryMockup() {
  const alerts = [
    { product: "Trapiche Malbec Reserva", stock: 3, min: 10 },
    { product: "Salentein Pinot Noir", stock: 2, min: 8 },
    { product: "Norton Privada", stock: 1, min: 5 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="bg-card border border-border/60 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
        <div className="h-12 bg-[#7b1f3a] flex items-center px-4 gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-white/30" />
            <div className="w-3 h-3 rounded-full bg-white/30" />
            <div className="w-3 h-3 rounded-full bg-white/30" />
          </div>
          <div className="ml-4 text-white/80 text-xs font-medium">Inventario</div>
        </div>

        <div className="p-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
              <PackageCheck className="w-4 h-4 text-emerald-600 mb-1.5" />
              <div className="text-sm font-bold text-emerald-700">138</div>
              <div className="text-[10px] text-emerald-600">Productos OK</div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 mb-1.5" />
              <div className="text-sm font-bold text-amber-700">4</div>
              <div className="text-[10px] text-amber-600">Stock bajo</div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <TrendingDown className="w-4 h-4 text-red-600 mb-1.5" />
              <div className="text-sm font-bold text-red-700">1</div>
              <div className="text-[10px] text-red-600">Sin stock</div>
            </div>
          </div>

          {/* Alerts table */}
          <div className="border border-border/40 rounded-xl overflow-hidden">
            <div className="px-4 py-2.5 bg-amber-50/50 border-b border-amber-100">
              <div className="text-[10px] font-semibold text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Alertas de stock bajo
              </div>
            </div>
            {alerts.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-4 py-3 border-t border-border/30"
              >
                <span className="text-xs font-medium text-foreground">{a.product}</span>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${(a.stock / a.min) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-red-600">{a.stock}</span>
                  <span className="text-[10px] text-muted-foreground">/ {a.min}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
