import { AppShell } from "@/components/layout/app-shell";
import { getSaleById } from "@/lib/actions";
import { getCurrentUser } from "@/lib/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, User, Calendar, CreditCard, Pencil, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { DeleteSaleButton } from "@/components/sales/delete-sale-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getPaymentMethodLabel } from "@/lib/utils";

export default async function SaleDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sale, user] = await Promise.all([getSaleById(id), getCurrentUser()]);

  if (!sale) {
    notFound();
  }

  const isOwner = user?.role === "OWNER";

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <BackButton href="/ventas" />
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-heading text-2xl font-bold tracking-tight break-words">
                {sale.saleNumber}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
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
                  {getPaymentMethodLabel(sale.paymentMethod || "CASH")}
                </Badge>
              </div>
            </div>
            {isOwner && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <Link href={`/ventas/editar/${sale.id}`} className="w-full sm:w-auto">
                  <Button variant="outline" className="gap-2 w-full">
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                </Link>
                <DeleteSaleButton
                  saleId={sale.id}
                  saleNumber={sale.saleNumber}
                  variant="button"
                  className="w-full sm:w-auto"
                />
              </div>
            )}
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

            {sale.salePromotions?.length > 0 && (
              <>
                <Separator />
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[#7b1f3a]" />
                  <h4 className="font-heading font-semibold">Promociones</h4>
                </div>
                {sale.salePromotions.map((sp: any) => (
                  <div
                    key={sp.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-4"
                  >
                    <div>
                      <p className="font-medium">{sp.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {sp.items?.map((i: any) => `${i.quantity} × ${i.product?.name}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {sp.quantity} x {formatPrice(Number(sp.salePrice))}
                      </p>
                      <p className="font-semibold text-[#7b1f3a]">
                        {formatPrice(Number(sp.totalPrice))}
                      </p>
                    </div>
                  </div>
                ))}
              </>
            )}

            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  {formatPrice(Number(sale.totalAmount) + Number(sale.discountAmount || 0))}
                </span>
              </div>
              {Number(sale.discountPercentage || 0) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    Descuento ({sale.discountPercentage}%)
                  </span>
                  <span className="text-emerald-600">
                    -{formatPrice(Number(sale.discountAmount || 0))}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-heading text-lg font-semibold">Total</span>
                <span className="font-heading text-2xl font-bold text-[#7b1f3a]">
                  {formatPrice(Number(sale.totalAmount))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
