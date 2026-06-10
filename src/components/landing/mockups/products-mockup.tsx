"use client";

import { motion } from "framer-motion";
import { Search, Plus, Wine } from "lucide-react";

export function ProductsMockup() {
  const products = [
    { name: "Rutini Malbec", winery: "Rutini Wines", price: "$18.500", stock: 24 },
    { name: "Luigi Bosca Malbec", winery: "Luigi Bosca", price: "$22.000", stock: 12 },
    { name: "Zuccardi Q Malbec", winery: "Zuccardi", price: "$15.900", stock: 8 },
    { name: "Catena Zapata Alta", winery: "Catena Zapata", price: "$45.000", stock: 5 },
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
          <div className="ml-4 text-white/80 text-xs font-medium">Productos</div>
        </div>

        <div className="p-5">
          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Search className="w-3.5 h-3.5" />
              Buscar productos...
            </div>
            <div className="bg-[#7b1f3a] text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Nuevo
            </div>
          </div>

          {/* Table */}
          <div className="border border-border/40 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr,auto,auto,auto] gap-3 px-4 py-2.5 bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase">
              <span>Producto</span>
              <span>Bodega</span>
              <span>Precio</span>
              <span>Stock</span>
            </div>
            {products.map((p, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr,auto,auto,auto] gap-3 px-4 py-3 border-t border-border/30 items-center"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#7b1f3a]/10 flex items-center justify-center">
                    <Wine className="w-3.5 h-3.5 text-[#7b1f3a]" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{p.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{p.winery}</span>
                <span className="text-xs font-medium text-foreground">{p.price}</span>
                <span className={`text-xs font-medium ${p.stock < 10 ? "text-red-600" : "text-emerald-600"}`}>
                  {p.stock}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
