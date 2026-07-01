"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createSupplier, updateSupplier } from "@/lib/supplier-actions";

interface SupplierFormProps {
  supplier?: any;
}

export function SupplierForm({ supplier }: SupplierFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!supplier;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      contactName: (formData.get("contactName") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      cbuAlias: (formData.get("cbuAlias") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    try {
      if (isEditing) {
        await updateSupplier(supplier.id, data);
        toast.success("Proveedor actualizado");
      } else {
        await createSupplier(data);
        toast.success("Proveedor creado");
      }
      router.push("/proveedores");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar el proveedor");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7b1f3a]/10">
              <Truck className="h-5 w-5 text-[#7b1f3a]" />
            </div>
            <h3 className="font-heading text-lg font-semibold">
              {isEditing ? "Editar proveedor" : "Nuevo proveedor"}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nombre del proveedor *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={supplier?.name}
                placeholder="Ej: Bodega Los Andes"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Nombre de contacto</Label>
              <Input
                id="contactName"
                name="contactName"
                defaultValue={supplier?.contactName || ""}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={supplier?.phone || ""}
                placeholder="Ej: +54 9 11 1234 5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={supplier?.email || ""}
                placeholder="Ej: juan@bodega.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cbuAlias">CBU / Alias</Label>
              <Input
                id="cbuAlias"
                name="cbuAlias"
                defaultValue={supplier?.cbuAlias || ""}
                placeholder="Ej: bodega.losandes"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={supplier?.notes || ""}
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
          onClick={() => router.push("/proveedores")}
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
            "Guardar proveedor"
          )}
        </Button>
      </div>
    </form>
  );
}
