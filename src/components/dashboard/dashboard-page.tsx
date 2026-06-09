"use client";

import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  DollarSign,
  Wine,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SalesChart } from "./sales-chart";
import { formatPrice } from "@/lib/utils";

interface DashboardData {
  salesToday: { count: number; revenue: number };
  salesWeek: number;
  salesMonth: { count: number; revenue: number };
  totalProducts: number;
  totalInventoryValue: number;
  lowStockProducts: any[];
  recentSales: any[];
  topProducts: any[];
  salesTrend: { date: string; sales: number; revenue: number }[];
}

export function DashboardPage({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Ventas Hoy"
          value={data.salesToday.count.toString()}
          subtitle={`${formatPrice(data.salesToday.revenue)} en ingresos`}
          icon={ShoppingBag}
          trend="up"
        />
        <KpiCard
          title="Ventas Esta Semana"
          value={data.salesWeek.toString()}
          subtitle="transacciones"
          icon={TrendingUp}
        />
        <KpiCard
          title="Ventas Este Mes"
          value={data.salesMonth.count.toString()}
          subtitle={`${formatPrice(data.salesMonth.revenue)} en ingresos`}
          icon={DollarSign}
          trend="up"
        />
        <KpiCard
          title="Productos Activos"
          value={data.totalProducts.toString()}
          subtitle={`${formatPrice(data.totalInventoryValue)} en stock`}
          icon={Package}
        />
      </div>

      {/* Charts & Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg">Tendencia de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={data.salesTrend} />
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
                      <p className="text-xs text-muted-foreground">
                        {product.winery}
                      </p>
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
                        {item.product?.winery}
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
                  <div
                    key={sale.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3"
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
                  </div>
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
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down";
}) {
  return (
    <Card className="border-border/50 transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className="font-heading text-3xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              trend === "up"
                ? "bg-emerald-50 text-emerald-600"
                : trend === "down"
                ? "bg-red-50 text-red-600"
                : "bg-[#7b1f3a]/10 text-[#7b1f3a]"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
