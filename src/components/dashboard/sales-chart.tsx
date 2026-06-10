"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function SalesChart({
  data,
  mode,
}: {
  data: { date: string; sales: number; revenue: number }[];
  mode: "revenue" | "sales";
}) {
  const isRevenue = mode === "revenue";

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#78716c" }}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#78716c" }}
            tickFormatter={(value) =>
              isRevenue ? formatCurrency(Number(value)) : String(value)
            }
          />
          <Tooltip
            contentStyle={{
              borderRadius: "0.625rem",
              border: "1px solid #e7e5e4",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
            }}
            formatter={(value) => [
              isRevenue
                ? `$${Number(value).toLocaleString("es-AR")}`
                : String(value),
              isRevenue ? "Ingresos" : "Ventas",
            ]}
            labelFormatter={(label) => label}
          />
          <Bar
            dataKey={isRevenue ? "revenue" : "sales"}
            fill="#7b1f3a"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}
