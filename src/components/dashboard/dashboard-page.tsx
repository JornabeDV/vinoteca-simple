"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  DollarSign,
  Wine,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SalesChart } from "./sales-chart";
import { formatPrice } from "@/lib/utils";

interface DashboardData {
  salesToday: { count: number; revenue: number; change: number };
  salesWeek: { count: number; revenue: number; change: number };
  salesMonth: { count: number; revenue: number; change: number };
  avgTicket: { today: number; month: number; change: number };
  totalProducts: number;
  totalInventoryValue: number;
  lowStockProducts: any[];
  recentSales: any[];
  topProducts: any[];
  salesTrend: { date: string; sales: number; revenue: number }[];
}

export function DashboardPage({
  data,
  chartDays,
}: {
  data: DashboardData;
  chartDays: number;
}) {
  const router = useRouter();
  const [chartMode, setChartMode] = useState<"revenue" | "sales">("revenue");

  const timeFilters = [
    { label: "7 días", value: 7 },
    { label: "30 días", value: 30 },
    { label: "1 año", value: 365 },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-tour="dashboard-kpis">
        <KpiCard
          title="Ventas Hoy"
          value={data.salesToday.count.toString()}
          revenue={data.salesToday.revenue}
          change={data.salesToday.change}
          icon={ShoppingBag}
        />
        <KpiCard
          title="Ventas Esta Semana"
          value={formatPrice(data.salesWeek.revenue)}
          subtitle={`${data.salesWeek.count} transacciones`}
          change={data.salesWeek.change}
          icon={TrendingUp}
        />
        <KpiCard
          title="Ventas Este Mes"
          value={formatPrice(data.salesMonth.revenue)}
          subtitle={`${data.salesMonth.count} transacciones`}
          change={data.salesMonth.change}
          icon={DollarSign}
        />
        <KpiCard
          title="Ticket Promedio"
          value={formatPrice(data.avgTicket.month)}
          subtitle={`Hoy: ${formatPrice(data.avgTicket.today)}`}
          change={data.avgTicket.change}
          icon={Receipt}
        />
      </div>

      {/* Charts & Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="font-heading text-lg">Tendencia de Ventas</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {/* Time filters */}
                <div className="flex items-center bg-muted rounded-lg p-0.5">
                  {timeFilters.map((f) => (
                    <Button
                      key={f.value}
                      variant={chartDays === f.value ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs px-2 sm:px-3"
                      onClick={() => router.push(`/?chart=${f.value}`)}
                    >
                      {f.label}
                    </Button>
                  ))}
                </div>
                {/* Mode toggle */}
                <div className="flex items-center bg-muted rounded-lg p-0.5">
                  <Button
                    variant={chartMode === "revenue" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs gap-1 px-2 sm:px-3"
                    onClick={() => setChartMode("revenue")}
                    aria-label="Ingresos"
                    title="Ingresos"
                  >
                    <DollarSign className="h-3 w-3" />
                    <span className="hidden sm:inline">Ingresos</span>
                  </Button>
                  <Button
                    variant={chartMode === "sales" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 text-xs gap-1 px-2 sm:px-3"
                    onClick={() => setChartMode("sales")}
                    aria-label="Cantidad"
                    title="Cantidad"
                  >
                    <BarChart3 className="h-3 w-3" />
                    <span className="hidden sm:inline">Cantidad</span>
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SalesChart data={data.salesTrend} mode={chartMode} />
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Stock Bajo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hay productos con stock bajo
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className="ml-2 shrink-0 border-amber-200 bg-amber-50 text-amber-700"
                    >
                      {product.currentStock} / {product.minStock}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Recent Sales */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg">Productos Más Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Wine className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Aún no hay ventas registradas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.topProducts.map((item, i) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 rounded-lg border border-border/50 p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7b1f3a]/10 text-sm font-semibold text-[#7b1f3a]">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {item.product?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.product?.brand}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {item._sum.quantity} vendidos
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg">Ventas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  No hay ventas recientes
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentSales.map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/ventas/detalle/${sale.id}`}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{sale.saleNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.user?.name || sale.user?.email} ·{" "}
                        {new Date(sale.createdAt).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {formatPrice(Number(sale.totalAmount))}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  revenue,
  subtitle,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  revenue?: number;
  subtitle?: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const isPositive = change >= 0;
  const trendColor = isPositive ? "text-emerald-600" : "text-red-600";
  const trendBg = isPositive ? "bg-emerald-50" : "bg-red-50";

  return (
    <Card className="border-border/50 transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="font-heading text-2xl sm:text-3xl font-bold tracking-tight truncate">
              {value}
            </p>
            {revenue !== undefined && (
              <p className="text-xs text-muted-foreground">
                {formatPrice(revenue)} en ingresos
              </p>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${trendColor} ${trendBg}`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {isPositive ? "+" : ""}
                {change}%
              </span>
              <span className="text-[10px] text-muted-foreground">vs período anterior</span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7b1f3a]/10 text-[#7b1f3a] ml-3">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
