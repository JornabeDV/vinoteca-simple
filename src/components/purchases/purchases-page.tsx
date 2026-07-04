"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ShoppingBag,
  Plus,
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { deletePurchase } from "@/lib/purchase-actions";

interface PurchaseWithDetails {
  id: string;
  invoiceNumber?: string | null;
  totalAmount: number;
  purchaseDate: string;
  isPaid: boolean;
  totalPaid: number;
  remaining: number;
  supplier: { id: string; name: string };
  items: { quantity: number; product: { name: string } }[];
}

export function PurchasesPage({ purchases }: { purchases: PurchaseWithDetails[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = purchases.filter(
    (p) =>
      p.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPurchases = purchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
  const totalRemaining = purchases.reduce((sum, p) => sum + p.remaining, 0);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deletePurchase(id);
      toast.success("Compra eliminada");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la compra");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total comprado</p>
            <p className="font-heading text-2xl font-bold">{formatPrice(totalPurchases)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendiente de pago</p>
            <p className="font-heading text-2xl font-bold text-[#7b1f3a]">{formatPrice(totalRemaining)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar compras..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Link href="/compras/nueva">
          <Button size="lg" className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2 w-full sm:w-auto cursor-pointer">
            <Plus className="h-5 w-5" />
            Nueva compra
          </Button>
        </Link>
      </div>

      {/* Table */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Factura</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[100px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No se encontraron compras</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((purchase) => (
                    <TableRow
                      key={purchase.id}
                      className="group cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/compras/${purchase.id}`)}
                    >
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(purchase.purchaseDate).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell className="font-medium">{purchase.supplier.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {purchase.invoiceNumber || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {purchase.items.reduce((sum, i) => sum + i.quantity, 0)} unidades
                      </TableCell>
                      <TableCell className="font-semibold">{formatPrice(purchase.totalAmount)}</TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/compras/${purchase.id}`}>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <ConfirmDialog
                            title="Eliminar compra"
                            description="¿Estás seguro? Se revertirá el stock y se eliminarán las deudas/pagos asociados."
                            confirmText="Eliminar"
                            cancelText="Cancelar"
                            variant="destructive"
                            isLoading={deletingId === purchase.id}
                            onConfirm={() => handleDelete(purchase.id)}
                            trigger={
                              <Button variant="ghost" size="icon" className="cursor-pointer text-muted-foreground hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
