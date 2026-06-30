"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MoneyInput } from "@/components/ui/money-input";
import { ProductCombobox } from "@/components/inventory/product-combobox";
import { createPromotion, updatePromotion } from "@/lib/actions";
import { toast } from "sonner";

interface PromotionFormProps {
  promotion?: any;
  products: any[];
}

export function PromotionForm({ promotion, products }: PromotionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>(
    promotion?.items?.map((i: any) => ({
      productId: i.productId,
      quantity: i.quantity,
    })) || [{ productId: "", quantity: 1 }]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string) || undefined;
    const salePriceRaw = formData.get("salePrice") as string;
    const salePrice = parseFloat(salePriceRaw.replace(/[^\d.,]/g, "").replace(",", "."));

    const validItems = items.filter((i) => i.productId && i.quantity > 0);

    if (!name) {
      toast.error("El nombre es obligatorio");
      setIsLoading(false);
      return;
    }
    if (Number.isNaN(salePrice) || salePrice <= 0) {
      toast.error("El precio de la promo debe ser mayor a 0");
      setIsLoading(false);
      return;
    }
    if (validItems.length === 0) {
      toast.error("Agregá al menos un producto a la promo");
      setIsLoading(false);
      return;
    }

    try {
      if (promotion) {
        await updatePromotion(promotion.id, {
          name,
          description,
          salePrice,
          items: validItems,
        });
        toast.success("Promoción actualizada");
      } else {
        await createPromotion({
          name,
          description,
          salePrice,
          items: validItems,
        });
        toast.success("Promoción creada");
      }
      router.push("/promos");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar la promoción");
    } finally {
      setIsLoading(false);
    }
  }

  function addItem() {
    setItems((prev) => [...prev, { productId: "", quantity: 1 }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: "productId" | "quantity", value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  const activeProducts = products.filter((p) => p.status === "ACTIVE");

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
            <Tag className="h-5 w-5 text-[#7b1f3a]" />
            Información de la Promo
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nombre de la promo *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={promotion?.name}
                placeholder="Ej: Combo Gancia + Coca"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={promotion?.description || ""}
                placeholder="Detalle opcional de la promo"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio de la promo *</Label>
              <MoneyInput
                id="salePrice"
                name="salePrice"
                defaultValue={promotion?.salePrice}
                placeholder="$ 0,00"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold">Productos incluidos</h3>
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus className="h-4 w-4" />
              Agregar producto
            </Button>
          </div>

          {items.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No hay productos en esta promo.
            </p>
          )}

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <ProductCombobox
                    products={activeProducts}
                    value={item.productId}
                    onChange={(value) => updateItem(index, "productId", value)}
                    placeholder="Seleccionar producto..."
                  />
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    placeholder="Cantidad"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/promos")}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {promotion ? "Guardar cambios" : "Crear promoción"}
        </Button>
      </div>
    </form>
  );
}
