"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { TrendingUp, Trophy, AlertTriangle, BarChart3 } from "lucide-react";

function CountUp({ target, prefix = "", suffix = "" }: { target: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString("es-AR")}
      {suffix}
    </span>
  );
}

const metrics = [
  {
    icon: TrendingUp,
    label: "Ventas del mes",
    value: 1245000,
    prefix: "$",
    trend: "+12% vs mes anterior",
    trendColor: "text-emerald-600",
    chart: (
      <div className="flex items-end gap-1 h-10 mt-3">
        {[30, 45, 35, 60, 50, 75, 65, 80, 70, 90, 85, 100].map((h, i) => (
          <div key={i} className="flex-1 bg-[#7b1f3a]/20 rounded-t-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    ),
  },
  {
    icon: Trophy,
    label: "Producto más vendido",
    value: 342,
    suffix: " unidades",
    trend: "Rutini Malbec",
    trendColor: "text-[#7b1f3a]",
    chart: (
      <div className="mt-3 space-y-1.5">
        {[
          { name: "Rutini Malbec", pct: 85 },
          { name: "Luigi Bosca", pct: 60 },
          { name: "Zuccardi Q", pct: 45 },
          { name: "Catena Alta", pct: 30 },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-20 truncate">{item.name}</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-[#7b1f3a] rounded-full" style={{ width: `${item.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: AlertTriangle,
    label: "Alertas de stock",
    value: 4,
    suffix: " productos",
    trend: "Reponer esta semana",
    trendColor: "text-amber-600",
    chart: (
      <div className="mt-3 flex items-center gap-2">
        <div className="w-16 h-16 rounded-full border-4 border-amber-200 flex items-center justify-center">
          <span className="text-lg font-bold text-amber-600">4</span>
        </div>
        <div className="flex-1 space-y-1">
          <div className="text-[10px] text-muted-foreground">Stock crítico: 1</div>
          <div className="text-[10px] text-muted-foreground">Stock bajo: 3</div>
          <div className="text-[10px] text-emerald-600">Todo en orden: 138</div>
        </div>
      </div>
    ),
  },
  {
    icon: BarChart3,
    label: "Margen promedio",
    value: 42,
    suffix: "%",
    trend: "+3% vs mes anterior",
    trendColor: "text-emerald-600",
    chart: (
      <div className="flex items-end gap-1 h-10 mt-3">
        {[40, 42, 38, 45, 43, 48, 46, 50, 47, 52, 49, 55].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${h}%`, backgroundColor: i === 11 ? "#7b1f3a" : "#7b1f3a20" }}
          />
        ))}
      </div>
    ),
  },
];

export function MetricsSection() {
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
            Tus números, claros y al instante
          </h2>
          <p className="mt-4 text-muted-foreground">
            Dejá de calcular a mano. Las métricas que importan, siempre actualizadas.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-card border border-border/50 rounded-2xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <metric.icon className="w-5 h-5 text-[#7b1f3a]" />
                <span className={`text-[10px] font-medium ${metric.trendColor}`}>{metric.trend}</span>
              </div>
              <div className="font-heading text-2xl font-bold text-foreground">
                <CountUp target={metric.value} prefix={metric.prefix} suffix={metric.suffix} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{metric.label}</div>
              {metric.chart}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
