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
}: {
  data: { date: string; sales: number; revenue: number }[];
}) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e7e5e4" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#78716c" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#78716c" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "0.625rem",
              border: "1px solid #e7e5e4",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
            }}
            formatter={(value, name) => [
              name === "revenue" ? `$${Number(value).toLocaleString("es-AR")}` : String(value),
              name === "revenue" ? "Ingresos" : "Ventas",
            ]}
          />
          <Bar
            dataKey="sales"
            fill="#7b1f3a"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
