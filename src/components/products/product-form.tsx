"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createProduct, updateProduct, createCategory } from "@/lib/actions";
import { ProductType } from "@prisma/client";

interface ProductFormProps {
  product?: any;
  categories?: any[];
}

const PRODUCT_TYPE_LABELS: Record<
  ProductType,
  { brand: string; style: string; year?: string }
> = {
  WINE: { brand: "Bodega", style: "Varietal", year: "Año" },
  BEER: { brand: "Marca", style: "Estilo" },
  SPIRIT: { brand: "Destilería", style: "Tipo" },
  WATER: { brand: "Marca", style: "Tipo" },
  NON_ALCOHOLIC: { brand: "Marca", style: "Variedad" },
  OTHER: { brand: "Marca / Productor", style: "Tipo / Estilo", year: "Año" },
};

const PRODUCT_TYPE_OPTIONS = [
  { value: ProductType.WINE, label: "Vino" },
  { value: ProductType.BEER, label: "Cerveza" },
  { value: ProductType.SPIRIT, label: "Destilado" },
  { value: ProductType.WATER, label: "Agua" },
  { value: ProductType.NON_ALCOHOLIC, label: "Bebida sin alcohol" },
  { value: ProductType.OTHER, label: "Otro" },
];

export function ProductForm({ product, categories = [] }: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(product?.image || "");
  const [productType, setProductType] = useState<ProductType>(
    product?.productType || ProductType.WINE,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "__new__">(
    product?.categoryId || ""
  );
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);

  const labels = PRODUCT_TYPE_LABELS[productType];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    if (
      !selectedCategoryId ||
      (selectedCategoryId === "__new__" && !newCategoryName.trim())
    ) {
      toast.error("Seleccioná una categoría");
      setIsLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get("name") as string,
      brand: formData.get("brand") as string,
      style: formData.get("style") as string,
      year: formData.get("year")
        ? parseInt(formData.get("year") as string)
        : null,
      description: (formData.get("description") as string) || undefined,
      productType,
      costPrice: parseFloat(formData.get("costPrice") as string),
      salePrice: parseFloat(formData.get("salePrice") as string),
      minStock: parseInt(formData.get("minStock") as string) || 0,
      image: imagePreview || null,
    };

    // El stock solo se define al crear un producto; en edición se gestiona desde Inventario
    if (!product) {
      data.currentStock = parseInt(formData.get("currentStock") as string) || 0;
    }

    if (selectedCategoryId && selectedCategoryId !== "__new__") {
      data.categoryId = selectedCategoryId;
    } else if (selectedCategoryId === "__new__" && newCategoryName.trim()) {
      data.categoryName = newCategoryName.trim();
    }

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
      <div className="space-y-6">
        <Card className="border-border/50">
          <CardContent className="space-y-4">
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
                <Label>Tipo de producto *</Label>
                <Select
                  value={productType}
                  onValueChange={(v) => setProductType(v as ProductType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar tipo">
                      {
                        PRODUCT_TYPE_OPTIONS.find(
                          (opt) => opt.value === productType,
                        )?.label
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría *</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={(value) => {
                    if (value === "__new__") {
                      setIsNewCategoryDialogOpen(true);
                    } else {
                      setSelectedCategoryId(value || "");
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar categoría">
                      {localCategories.find((cat) => cat.id === selectedCategoryId)?.name ||
                        "Seleccionar categoría"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {localCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="__new__" className="font-medium text-[#7b1f3a]">
                      + Nueva categoría
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">{labels.brand} *</Label>
                <Input
                  id="brand"
                  name="brand"
                  defaultValue={product?.brand}
                  placeholder="Ej: Trapiche"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">{labels.style} *</Label>
                <Input
                  id="style"
                  name="style"
                  defaultValue={product?.style}
                  placeholder="Ej: Malbec"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">{labels.year || "Año"}</Label>
                <Input
                  id="year"
                  name="year"
                  type="number"
                  defaultValue={product?.year || ""}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={product?.description || ""}
                  placeholder="Notas de cata, descripción del producto..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="space-y-4">
            <h3 className="font-heading text-lg font-semibold">Precios</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Precio de Costo *</Label>
                <MoneyInput
                  id="costPrice"
                  name="costPrice"
                  defaultValue={product?.costPrice}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Precio de Venta *</Label>
                <MoneyInput
                  id="salePrice"
                  name="salePrice"
                  defaultValue={product?.salePrice}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="space-y-4">
            <h3 className="font-heading text-lg font-semibold">Inventario</h3>
            <div className="grid gap-4 sm:grid-cols-2">
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
          <CardContent className="space-y-4">
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

      <div className="flex max-sm:flex-col max-sm:items-center sm:justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="max-sm:w-full"
          onClick={() => router.push("/productos")}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="max-sm:w-full"
          size="xl"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? "Guardar Cambios" : "Crear Producto"}
        </Button>
      </div>

      <Dialog
        open={isNewCategoryDialogOpen}
        onOpenChange={setIsNewCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Nueva Categoría</DialogTitle>
            <DialogDescription>
              Creá una categoría para organizar tus productos.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newCategoryName.trim()) return;

              setIsCreatingCategory(true);
              try {
                const category = await createCategory({
                  name: newCategoryName.trim(),
                });
                setLocalCategories((prev) =>
                  [...prev, category].sort((a, b) =>
                    a.name.localeCompare(b.name)
                  )
                );
                setSelectedCategoryId(category.id);
                setNewCategoryName("");
                setIsNewCategoryDialogOpen(false);
                toast.success("Categoría creada");
              } catch (error: any) {
                toast.error(error.message || "Error al crear categoría");
              } finally {
                setIsCreatingCategory(false);
              }
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="newCategoryName">Nombre</Label>
              <Input
                id="newCategoryName"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Vino Tinto"
                autoFocus
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewCategoryDialogOpen(false);
                  setNewCategoryName("");
                  if (!selectedCategoryId) setSelectedCategoryId("");
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isCreatingCategory || !newCategoryName.trim()}
                className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
              >
                {isCreatingCategory && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  );
}
