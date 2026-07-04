"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createSupplierDebt } from "@/lib/supplier-actions";

interface SupplierDebtFormProps {
  supplier: any;
}

export function SupplierDebtForm({ supplier }: SupplierDebtFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const totalAmount = parseFloat(formData.get("totalAmount") as string);
    const issueDate = (formData.get("issueDate") as string) || undefined;
    const dueDate = (formData.get("dueDate") as string) || null;

    if (!totalAmount || totalAmount <= 0) {
      toast.error("El monto debe ser mayor a 0");
      setIsLoading(false);
      return;
    }

    try {
      await createSupplierDebt({
        supplierId: supplier.id,
        invoiceNumber: (formData.get("invoiceNumber") as string) || undefined,
        concept: (formData.get("concept") as string) || "Deuda",
        totalAmount,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : null,
      });
      toast.success("Deuda registrada");
      router.push(`/proveedores/${supplier.id}`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar la deuda");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card className="border-border/50">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7b1f3a]/10">
              <FileText className="h-5 w-5 text-[#7b1f3a]" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold">Nueva deuda</h3>
              <p className="text-sm text-muted-foreground">{supplier.name}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="concept">Concepto *</Label>
              <Input
                id="concept"
                name="concept"
                placeholder="Ej: Compra de vinos"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Número de factura / comprobante</Label>
              <Input
                id="invoiceNumber"
                name="invoiceNumber"
                placeholder="Ej: 001-00001234"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Monto total *</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDate">Fecha de emisión</Label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha de vencimiento</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
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
          className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Guardar deuda"
          )}
        </Button>
      </div>
    </form>
  );
}
