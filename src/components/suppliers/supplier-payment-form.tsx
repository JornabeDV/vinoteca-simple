"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createSupplierPayment } from "@/lib/supplier-actions";
import { formatPrice } from "@/lib/utils";

interface SupplierPaymentFormProps {
  supplier: any;
}

export function SupplierPaymentForm({ supplier }: SupplierPaymentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [debtId, setDebtId] = useState<string>("__account__");

  const pendingDebts = supplier.debts.filter(
    (d: any) => d.status !== "PAID"
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);
    const paymentDate = (formData.get("paymentDate") as string) || undefined;
    const paymentMethod = (formData.get("paymentMethod") as string) || undefined;
    const notes = (formData.get("notes") as string) || undefined;

    if (!amount || amount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      setIsLoading(false);
      return;
    }

    try {
      await createSupplierPayment({
        supplierId: supplier.id,
        debtId: debtId === "__account__" ? null : debtId,
        amount,
        paymentDate: paymentDate ? new Date(paymentDate) : undefined,
        paymentMethod,
        notes,
      });
      toast.success("Pago registrado");
      router.push(`/proveedores/${supplier.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar el pago");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card className="border-border/50">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Banknote className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Nuevo pago</h3>
              <p className="text-sm text-muted-foreground">{supplier.name}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Aplicar a</Label>
              <Select value={debtId} onValueChange={(value) => setDebtId(value || "__account__")}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue>
                    {debtId === "__account__"
                      ? "Pago a cuenta (sin imputar)"
                      : pendingDebts.find((d: any) => d.id === debtId)?.concept ||
                        "Seleccionar deuda"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__account__">Pago a cuenta (sin imputar)</SelectItem>
                  {pendingDebts.map((debt: any) => (
                    <SelectItem key={debt.id} value={debt.id}>
                      {debt.concept} — {formatPrice(Number(debt.totalAmount) - Number(debt.paidAmount))} pend.
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Fecha de pago</Label>
              <Input
                id="paymentDate"
                name="paymentDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de pago</Label>
              <Input
                id="paymentMethod"
                name="paymentMethod"
                placeholder="Ej: Transferencia"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Información adicional..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/proveedores/${supplier.id}`)}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Guardar pago"
          )}
        </Button>
      </div>
    </form>
  );
}
