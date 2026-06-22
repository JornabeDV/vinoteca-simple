import { AppShell } from "@/components/layout/app-shell";
import { getSaleById } from "@/lib/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, User, Calendar, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

export default async function SaleDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sale = await getSaleById(id);

  if (!sale) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/ventas">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {sale.saleNumber}
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {new Date(sale.createdAt).toLocaleString("es-AR")}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {sale.user?.name || sale.user?.email}
              </span>
              {sale.customer && (
                <span className="flex items-center gap-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  {sale.customer.name}
                </span>
              )}
              <Badge
                variant="outline"
                className={`text-xs ${
                  sale.isPaid
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {sale.isPaid ? "Pagada" : "Cuenta corriente"}
              </Badge>
            </div>
          </div>
        </div>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-[#7b1f3a]" />
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sale.items?.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border border-border/50 p-4"
              >
                <div>
                  <p className="font-medium">{item.product?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.product?.brand}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {item.quantity} x {formatPrice(Number(item.unitPrice))}
                  </p>
                  <p className="font-semibold text-[#7b1f3a]">
                    {formatPrice(Number(item.totalPrice))}
                  </p>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-heading text-lg font-semibold">Total</span>
              <span className="font-heading text-2xl font-bold text-[#7b1f3a]">
                {formatPrice(Number(sale.totalAmount))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
