"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Tag, ListChecks } from "lucide-react";
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

const PROMO_TYPES = [
  { value: "FIXED", label: "Fija", description: "Combo con productos y cantidades definidas" },
  { value: "DYNAMIC", label: "Dinámica", description: "El vendedor elige los productos al momento de vender" },
];

export function PromotionForm({ promotion, products }: PromotionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<string>(promotion?.type || "FIXED");
  const [requiredItemCount, setRequiredItemCount] = useState<number | "">(
    promotion?.requiredItemCount ?? ""
  );
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>(
    promotion?.items?.map((i: any) => ({
      productId: i.productId,
      quantity: i.quantity,
    })) || []
  );

  const isDynamic = type === "DYNAMIC";
  const activeProducts = products.filter((p) => p.status === "ACTIVE");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const description = (formData.get("description") as string) || undefined;
    const salePriceRaw = formData.get("salePrice") as string;
    const salePrice = parseFloat(salePriceRaw.replace(/[^\d.,]/g, "").replace(",", "."));

    const validItems = isDynamic
      ? items.filter((i) => i.productId).map((i) => ({ productId: i.productId, quantity: 1 }))
      : items.filter((i) => i.productId && i.quantity > 0);

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

    if (isDynamic) {
      const count = typeof requiredItemCount === "number" ? requiredItemCount : 0;
      if (count < 2) {
        toast.error("Una promo dinámica debe requerir al menos 2 productos");
        setIsLoading(false);
        return;
      }
      if (count > validItems.length) {
        toast.error("La cantidad a elegir no puede ser mayor a los productos disponibles");
        setIsLoading(false);
        return;
      }
    }

    try {
      const payload = {
        name,
        description,
        salePrice,
        type: type as "FIXED" | "DYNAMIC",
        requiredItemCount: isDynamic ? (requiredItemCount as number) : null,
        items: validItems,
      };

      if (promotion) {
        await updatePromotion(promotion.id, payload);
        toast.success("Promoción actualizada");
      } else {
        await createPromotion(payload);
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

  function addEligibleProduct(productId: string) {
    setItems((prev) => {
      if (prev.some((i) => i.productId === productId)) return prev;
      return [...prev, { productId, quantity: 1 }];
    });
  }

  const eligibleProductIds = new Set(items.map((i) => i.productId).filter(Boolean));
  const availableEligibleProducts = activeProducts.filter((p) => !eligibleProductIds.has(p.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border-border/50">
        <CardContent className="space-y-4">
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

            <div className="space-y-2">
              <Label>Tipo de promo</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PROMO_TYPES.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      type === option.value
                        ? "border-[#7b1f3a] bg-[#7b1f3a]/5 text-[#7b1f3a]"
                        : "border-border/50 hover:bg-muted"
                    }`}
                  >
                    <span className="font-medium block">{option.label}</span>
                    <span className="text-[10px] leading-tight text-muted-foreground">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {isDynamic && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="requiredItemCount">Cantidad de productos a elegir *</Label>
                <Input
                  id="requiredItemCount"
                  name="requiredItemCount"
                  type="number"
                  min={2}
                  value={requiredItemCount}
                  onChange={(e) =>
                    setRequiredItemCount(e.target.value === "" ? "" : parseInt(e.target.value))
                  }
                  placeholder="Ej: 2"
                  className="max-w-[200px]"
                  required={isDynamic}
                />
                <p className="text-xs text-muted-foreground">
                  El vendedor deberá elegir exactamente esta cantidad de productos al vender.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-[#7b1f3a]" />
              {isDynamic ? "Productos elegibles" : "Productos incluidos"}
            </h3>
            {!isDynamic && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="gap-1 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Agregar producto
              </Button>
            )}
          </div>

          {isDynamic ? (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <ProductCombobox
                    products={availableEligibleProducts}
                    value=""
                    onChange={(value) => value && addEligibleProduct(value)}
                    placeholder="Buscar y agregar producto..."
                  />
                </div>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No hay productos elegibles en esta promo todavía.
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const product = activeProducts.find((p) => p.id === item.productId);
                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {product?.name || "Producto"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {[product?.brand, product?.style].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="shrink-0 h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {items.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay productos en esta promo.
                </p>
              )}

              {items.map((item, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1 min-w-0">
                    <ProductCombobox
                      products={activeProducts}
                      value={item.productId}
                      onChange={(value) => updateItem(index, "productId", value)}
                      placeholder="Seleccionar producto..."
                    />
                  </div>
                  <div className="w-12 sm:w-16 shrink-0">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      placeholder="Cantidad"
                      className="h-10 text-center"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="shrink-0 h-10 w-10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex max-sm:flex-col max-sm:items-center sm:justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="max-sm:w-full"
          onClick={() => router.push("/promos")}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          size="xl"
          className="max-sm:w-full bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {promotion ? "Guardar Cambios" : "Crear Promoción"}
        </Button>
      </div>
    </form>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(value);
}
