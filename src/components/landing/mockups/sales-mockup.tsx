"use client";

import { motion } from "framer-motion";
import { Plus, Minus, ShoppingCart, Trash2 } from "lucide-react";

export function SalesMockup() {
  const items = [
    { name: "Rutini Malbec", qty: 2, price: "$18.500", total: "$37.000" },
    { name: "Luigi Bosca Malbec", qty: 1, price: "$22.000", total: "$22.000" },
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
          <div className="ml-4 text-white/80 text-xs font-medium">Nueva Venta</div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Product search */}
            <div>
              <div className="bg-muted/50 rounded-lg px-3 py-2.5 text-xs text-muted-foreground mb-3">
                Buscar producto...
              </div>
              <div className="space-y-2">
                {["Rutini Malbec - $18.500", "Luigi Bosca Malbec - $22.000", "Zuccardi Q - $15.900"].map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                    <span className="text-xs font-medium text-foreground">{p}</span>
                    <Plus className="w-3.5 h-3.5 text-[#7b1f3a]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Cart */}
            <div className="bg-muted/20 rounded-xl p-4 border border-border/40">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4 text-[#7b1f3a]" />
                <span className="text-xs font-semibold text-foreground">Carrito</span>
              </div>
              <div className="space-y-2 mb-4">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-card rounded-lg border border-border/30 gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-foreground truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">{item.price} c/u</div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <Minus className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium w-4 text-center">{item.qty}</span>
                        <Plus className="w-3 h-3 text-[#7b1f3a]" />
                      </div>
                      <span className="text-xs font-semibold text-foreground ml-1">{item.total}</span>
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-border/40 pt-3 flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Total</span>
                <span className="text-sm font-bold text-foreground">$59.000</span>
              </div>
              <div className="bg-[#7b1f3a] text-white text-xs font-medium py-2.5 rounded-lg text-center">
                Confirmar venta
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
