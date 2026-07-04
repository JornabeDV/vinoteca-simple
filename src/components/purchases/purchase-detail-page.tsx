"use client";

import Link from "next/link";
import {
  ShoppingBag,
  Truck,
  FileText,
  Banknote,
  CheckCircle2,
  Clock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BackButton } from "@/components/ui/back-button";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { deletePurchase } from "@/lib/purchase-actions";
import { useRouter } from "next/navigation";

export function PurchaseDetailPage({ purchase }: { purchase: any }) {
  const router = useRouter();

  async function handleDelete() {
    try {
      await deletePurchase(purchase.id);
      toast.success("Compra eliminada");
      router.push("/compras");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la compra");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <BackButton href="/compras" />
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Compra {purchase.invoiceNumber || purchase.id.slice(0, 8)}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              {new Date(purchase.purchaseDate).toLocaleDateString("es-AR")}
            </span>
            <span className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" />
              {purchase.supplier.name}
            </span>
            {purchase.isPaid || purchase.remaining <= 0 ? (
              <Badge variant="outline" className="text-xs border-emerald-200 bg-emerald-50 text-emerald-700 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Pagada
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700 gap-1">
                <Clock className="h-3 w-3" />
                Pendiente
              </Badge>
            )}
          </div>
        </div>
        <ConfirmDialog
          title="Eliminar compra"
          description="¿Estás seguro? Se revertirá el stock y se eliminarán las deudas/pagos asociados."
          confirmText="Eliminar"
          cancelText="Cancelar"
          variant="default"
          onConfirm={handleDelete}
          trigger={
            <Button variant="outline" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          }
        />
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-heading text-xl font-bold">{formatPrice(purchase.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pagado</p>
            <p className="font-heading text-xl font-bold text-emerald-600">{formatPrice(purchase.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pendiente</p>
            <p className={`font-heading text-xl font-bold ${purchase.remaining > 0 ? "text-[#7b1f3a]" : "text-emerald-600"}`}>
              {formatPrice(purchase.remaining)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#7b1f3a]" />
            Productos comprados
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Costo unitario</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchase.items.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{formatPrice(item.unitCost)}</TableCell>
                    <TableCell className="font-semibold">{formatPrice(item.totalCost)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Payments / Debts */}
      {purchase.isPaid && purchase.payments.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Banknote className="h-5 w-5 text-emerald-600" />
              Pago registrado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {purchase.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div>
                  <p className="font-medium">{formatPrice(p.amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(p.paymentDate).toLocaleDateString("es-AR")}
                    {p.paymentMethod && ` · ${p.paymentMethod}`}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!purchase.isPaid && purchase.debts.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#7b1f3a]" />
              Deuda generada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {purchase.debts.map((debt: any) => (
              <div key={debt.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4">
                <div>
                  <p className="font-medium">{debt.concept}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(Number(debt.totalAmount) - Number(debt.paidAmount))} pendientes
                  </p>
                </div>
                <Link href={`/proveedores/${purchase.supplier.id}`}>
                  <Button variant="outline" size="sm">Ver proveedor</Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {purchase.notes && (
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{purchase.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
