"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Trash2,
  FileText,
  Banknote,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { deleteSupplierDebt, deleteSupplierPayment } from "@/lib/supplier-actions";
import { SupplierDebtStatus } from "@prisma/client";

function statusLabel(status: SupplierDebtStatus) {
  switch (status) {
    case SupplierDebtStatus.PAID:
      return "Pagada";
    case SupplierDebtStatus.PARTIAL:
      return "Parcial";
    case SupplierDebtStatus.OVERDUE:
      return "Vencida";
    default:
      return "Pendiente";
  }
}

function statusClasses(status: SupplierDebtStatus) {
  switch (status) {
    case SupplierDebtStatus.PAID:
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case SupplierDebtStatus.PARTIAL:
      return "border-blue-200 bg-blue-50 text-blue-700";
    case SupplierDebtStatus.OVERDUE:
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

export function SupplierDetailPage({ supplier }: { supplier: any }) {
  const [deletingDebtId, setDeletingDebtId] = useState<string | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  async function handleDeleteDebt(id: string) {
    setDeletingDebtId(id);
    try {
      await deleteSupplierDebt(id);
      toast.success("Deuda eliminada");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la deuda");
    } finally {
      setDeletingDebtId(null);
    }
  }

  async function handleDeletePayment(id: string) {
    setDeletingPaymentId(id);
    try {
      await deleteSupplierPayment(id);
      toast.success("Pago eliminado");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el pago");
    } finally {
      setDeletingPaymentId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/proveedores"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-[#7b1f3a] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a proveedores
          </Link>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            {supplier.name}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {supplier.contactName && <span>{supplier.contactName}</span>}
            {supplier.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {supplier.phone}
              </span>
            )}
            {supplier.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {supplier.email}
              </span>
            )}
            {supplier.cbuAlias && (
              <span className="flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                {supplier.cbuAlias}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/proveedores/${supplier.id}/editar`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`font-heading text-xl font-bold ${supplier.balance > 0 ? "text-[#7b1f3a]" : "text-emerald-600"}`}>
              {formatPrice(supplier.balance)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total deuda</p>
            <p className="font-heading text-xl font-bold">{formatPrice(supplier.totalDebt)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total pagado</p>
            <p className="font-heading text-xl font-bold text-emerald-600">{formatPrice(supplier.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              Vencido
            </p>
            <p className="font-heading text-xl font-bold text-amber-600">{formatPrice(supplier.overdueAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {supplier.notes && (
        <Card className="border-border/50 bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{supplier.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/proveedores/${supplier.id}/deuda/nueva`} className="flex-1 sm:flex-none">
          <Button variant="outline" className="w-full gap-2">
            <FileText className="h-4 w-4" />
            Nueva deuda
          </Button>
        </Link>
        <Link href={`/proveedores/${supplier.id}/pago/nuevo`} className="flex-1 sm:flex-none">
          <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Banknote className="h-4 w-4" />
            Nuevo pago
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="debts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="debts" className="gap-2">
            <FileText className="h-4 w-4" />
            Deudas
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <Banknote className="h-4 w-4" />
            Pagos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="debts">
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead>Factura</TableHead>
                      <TableHead>Emisión</TableHead>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Pagado</TableHead>
                      <TableHead>Saldo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-[80px] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplier.debts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                          No hay deudas registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplier.debts.map((debt: any) => {
                        const remaining = Number(debt.totalAmount) - Number(debt.paidAmount);
                        const isOverdue =
                          debt.status !== "PAID" &&
                          debt.dueDate &&
                          new Date(debt.dueDate) < new Date();
                        return (
                          <TableRow key={debt.id}>
                            <TableCell className="font-medium">{debt.concept}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {debt.invoiceNumber || "—"}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {new Date(debt.issueDate).toLocaleDateString("es-AR")}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {debt.dueDate ? (
                                <span className={isOverdue ? "text-amber-600 font-medium" : ""}>
                                  {new Date(debt.dueDate).toLocaleDateString("es-AR")}
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>{formatPrice(debt.totalAmount)}</TableCell>
                            <TableCell>{formatPrice(debt.paidAmount)}</TableCell>
                            <TableCell className="font-semibold">
                              {formatPrice(remaining)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${statusClasses(debt.status)}`}>
                                {statusLabel(debt.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <ConfirmDialog
                                title="Eliminar deuda"
                                description="¿Estás seguro? Se eliminarán también los pagos asociados."
                                confirmText="Eliminar"
                                cancelText="Cancelar"
                                variant="destructive"
                                isLoading={deletingDebtId === debt.id}
                                onConfirm={() => handleDeleteDebt(debt.id)}
                                trigger={
                                  <Button variant="ghost" size="icon" className="cursor-pointer text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                }
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Deuda</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead className="w-[80px] text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supplier.payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                          No hay pagos registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      supplier.payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {new Date(payment.paymentDate).toLocaleDateString("es-AR")}
                          </TableCell>
                          <TableCell className="font-semibold text-emerald-600">
                            {formatPrice(payment.amount)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.paymentMethod || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.debt ? payment.debt.concept : "A cuenta"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {payment.notes || "—"}
                          </TableCell>
                          <TableCell>
                            <ConfirmDialog
                              title="Eliminar pago"
                              description="¿Estás seguro de que querés eliminar este pago?"
                              confirmText="Eliminar"
                              cancelText="Cancelar"
                              variant="destructive"
                              isLoading={deletingPaymentId === payment.id}
                              onConfirm={() => handleDeletePayment(payment.id)}
                              trigger={
                                <Button variant="ghost" size="icon" className="cursor-pointer text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
