"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wine, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { createProduct, updateProduct } from "@/lib/actions";

interface ProductFormProps {
  product?: any;
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(product?.image || "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      winery: formData.get("winery") as string,
      category: formData.get("category") as string,
      varietal: formData.get("varietal") as string,
      vintage: formData.get("vintage")
        ? parseInt(formData.get("vintage") as string)
        : null,
      description: (formData.get("description") as string) || undefined,
      costPrice: parseFloat(formData.get("costPrice") as string),
      salePrice: parseFloat(formData.get("salePrice") as string),
      currentStock: parseInt(formData.get("currentStock") as string) || 0,
      minStock: parseInt(formData.get("minStock") as string) || 0,
      image: imagePreview || null,
    };

    try {
      if (product) {
        await updateProduct(product.id, data);
        toast.success("Producto actualizado");
      } else {
        await createProduct(data);
        toast.success("Producto creado");
      }
      router.push("/productos");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-heading text-lg font-semibold">
                Información Básica
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="name">Nombre del Producto *</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={product?.name}
                    placeholder="Ej: Malbec Reserva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="winery">Bodega *</Label>
                  <Input
                    id="winery"
                    name="winery"
                    defaultValue={product?.winery}
                    placeholder="Ej: Trapiche"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoría *</Label>
                  <Input
                    id="category"
                    name="category"
                    defaultValue={product?.category}
                    placeholder="Ej: Vino Tinto"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="varietal">Varietal *</Label>
                  <Input
                    id="varietal"
                    name="varietal"
                    defaultValue={product?.varietal}
                    placeholder="Ej: Malbec"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vintage">Añada</Label>
                  <Input
                    id="vintage"
                    name="vintage"
                    type="number"
                    defaultValue={product?.vintage || ""}
                    placeholder="2020"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={product?.description || ""}
                    placeholder="Notas de cata, descripción del vino..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-heading text-lg font-semibold">Precios</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Precio de Costo *</Label>
                  <Input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={product?.costPrice || ""}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salePrice">Precio de Venta *</Label>
                  <Input
                    id="salePrice"
                    name="salePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={product?.salePrice || ""}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-heading text-lg font-semibold">Inventario</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentStock">Stock Inicial</Label>
                  <Input
                    id="currentStock"
                    name="currentStock"
                    type="number"
                    min="0"
                    defaultValue={product?.currentStock || 0}
                    disabled={!!product}
                  />
                  {product && (
                    <p className="text-xs text-muted-foreground">
                      El stock se gestiona desde el módulo de inventario
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minStock">Stock Mínimo</Label>
                  <Input
                    id="minStock"
                    name="minStock"
                    type="number"
                    min="0"
                    defaultValue={product?.minStock || 0}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 hidden">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-heading text-lg font-semibold">Imagen</h3>
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-32 w-full items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <Wine className="h-10 w-10 text-muted-foreground/40" />
                  )}
                </div>
                <Input
                  placeholder="URL de la imagen"
                  value={imagePreview}
                  onChange={(e) => setImagePreview(e.target.value)}
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? "Guardar Cambios" : "Crear Producto"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/productos")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
