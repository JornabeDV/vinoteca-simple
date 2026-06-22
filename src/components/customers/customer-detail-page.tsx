"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  CreditCard,
  Wallet,
  Plus,
  Loader2,
  Calendar,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createPayment } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface Sale {
  id: string;
  saleNumber: string;
  totalAmount: number | any;
  isPaid: boolean;
  createdAt: string;
}

interface Payment {
  id: string;
  amount: number | any;
  notes?: string | null;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  dni?: string | null;
  address?: string | null;
  notes?: string | null;
  sales: Sale[];
  payments: Payment[];
}

export function CustomerDetailPage({
  customer,
  balance,
}: {
  customer: Customer;
  balance: { debt: number; paid: number; balance: number };
}) {
  const router = useRouter();
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unpaidSales = customer.sales.filter((s) => !s.isPaid);

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(paymentAmount.replace(",", "."));
    if (!amount || amount <= 0) {
      toast.error("Ingresá un monto válido");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPayment({
        customerId: customer.id,
        amount,
        notes: paymentNotes,
      });
      toast.success("Pago registrado");
      setIsPaymentDialogOpen(false);
      setPaymentAmount("");
      setPaymentNotes("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar pago");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/clientes">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            {customer.name}
          </h2>
          <p className="text-muted-foreground">
            Detalle de cuenta corriente
          </p>
        </div>
        <Button
          onClick={() => setIsPaymentDialogOpen(true)}
          className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Registrar Pago
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deuda Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-700">
              {formatPrice(balance.debt)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-700">
              {formatPrice(balance.paid)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                balance.balance > 0 ? "text-amber-700" : "text-emerald-700"
              }`}
            >
              {formatPrice(balance.balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-[#7b1f3a]" />
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {customer.phone && (
            <p className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              {customer.phone}
            </p>
          )}
          {customer.email && (
            <p className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              {customer.email}
            </p>
          )}
          {customer.dni && (
            <p className="flex items-center gap-2 text-sm">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              DNI / CUIT: {customer.dni}
            </p>
          )}
          {customer.address && (
            <p className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              {customer.address}
            </p>
          )}
          {customer.notes && (
            <p className="text-sm text-muted-foreground mt-2">
              Notas: {customer.notes}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-[#7b1f3a]" />
            Ventas en Cuenta Corriente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Venta</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unpaidSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No hay ventas pendientes
                    </TableCell>
                  </TableRow>
                ) : (
                  unpaidSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {sale.saleNumber}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(Number(sale.totalAmount))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700"
                        >
                          Pendiente
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#7b1f3a]" />
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-32 text-center text-muted-foreground">
                      No hay pagos registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  customer.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payment.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium text-emerald-700">
                        {formatPrice(Number(payment.amount))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Registrar Pago</DialogTitle>
            <DialogDescription>
              Registrá un pago de {customer.name}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Monto *</Label>
              <Input
                id="payment-amount"
                type="number"
                min="1"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0,00"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-notes">Notas</Label>
              <Input
                id="payment-notes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Ej: Pago parcial en efectivo"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Registrar Pago
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
