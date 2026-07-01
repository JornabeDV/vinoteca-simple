"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Truck,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  AlertCircle,
  ArrowUpRight,
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
import { deleteSupplier } from "@/lib/supplier-actions";

interface SupplierWithBalance {
  id: string;
  name: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  totalDebt: number;
  totalPaid: number;
  balance: number;
  pendingBalance: number;
  overdueAmount: number;
}

export function SuppliersPage({ suppliers }: { suppliers: SupplierWithBalance[] }) {
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.contactName && s.contactName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalBalance = suppliers.reduce((sum, s) => sum + s.balance, 0);
  const totalOverdue = suppliers.reduce((sum, s) => sum + s.overdueAmount, 0);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteSupplier(id);
      toast.success("Proveedor eliminado");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el proveedor");
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
            <p className="text-sm text-muted-foreground">Saldo total adeudado</p>
            <p className={`font-heading text-2xl font-bold ${totalBalance > 0 ? "text-[#7b1f3a]" : "text-emerald-600"}`}>
              {formatPrice(totalBalance)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Vencido
            </p>
            <p className="font-heading text-2xl font-bold text-amber-600">
              {formatPrice(totalOverdue)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar proveedores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Link href="/proveedores/nuevo">
          <Button size="lg" className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2 w-full sm:w-auto">
            <Plus className="h-5 w-5" />
            Nuevo proveedor
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
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Vencido</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Truck className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">No se encontraron proveedores</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((supplier) => (
                    <TableRow key={supplier.id} className="group">
                      <TableCell>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          {supplier.overdueAmount > 0 && (
                            <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700 mt-1">
                              Vencido
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {supplier.contactName || "—"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <span className={supplier.balance > 0 ? "text-[#7b1f3a]" : "text-emerald-600"}>
                          {formatPrice(supplier.balance)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {supplier.overdueAmount > 0 ? (
                          <span className="text-amber-600 font-medium">{formatPrice(supplier.overdueAmount)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/proveedores/${supplier.id}`}>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/proveedores/${supplier.id}/editar`}>
                            <Button variant="ghost" size="icon" className="cursor-pointer">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <ConfirmDialog
                            title="Eliminar proveedor"
                            description={`¿Estás seguro de que querés eliminar a ${supplier.name}? Se eliminarán también sus deudas y pagos.`}
                            confirmText="Eliminar"
                            cancelText="Cancelar"
                            variant="destructive"
                            isLoading={deletingId === supplier.id}
                            onConfirm={() => handleDelete(supplier.id)}
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

      {filtered.length > 0 && (
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-[#7b1f3a] transition-colors">
          Ver resumen de deudas
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
