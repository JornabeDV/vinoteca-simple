"use client";

import { useState } from "react";
import { Plus, Loader2, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createProduct, createCategory } from "@/lib/actions";

interface QuickProductDialogProps {
  categories: any[];
  onProductCreated: (product: any) => void;
  children?: React.ReactElement;
}

export function QuickProductDialog({
  categories,
  onProductCreated,
  children,
}: QuickProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [localCategories, setLocalCategories] = useState(categories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Track numeric values because MoneyInput works with hidden inputs + state
  const [costPrice, setCostPrice] = useState<number | undefined>();
  const [salePrice, setSalePrice] = useState<number | undefined>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedCategoryId) {
      toast.error("Seleccioná una categoría");
      return;
    }

    if (!costPrice || !salePrice) {
      toast.error("Completá ambos precios");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: (formData.get("name") as string).trim(),
      brand: (formData.get("brand") as string).trim(),
      style: (formData.get("style") as string).trim(),
      costPrice,
      salePrice,
      currentStock: parseInt((formData.get("currentStock") as string) || "0", 10),
      minStock: parseInt((formData.get("minStock") as string) || "0", 10),
      categoryId: selectedCategoryId,
    };

    if (!data.name || !data.brand || !data.style) {
      toast.error("Completá los campos obligatorios");
      return;
    }

    setIsLoading(true);
    try {
      const product = await createProduct(data);
      toast.success("Producto creado");
      onProductCreated(product);
      setOpen(false);
      // Reset form state
      setSelectedCategoryId("");
      setCostPrice(undefined);
      setSalePrice(undefined);
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      toast.error(error.message || "Error al crear el producto");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    try {
      const category = await createCategory({ name: newCategoryName.trim() });
      setLocalCategories((prev) =>
        [...prev, category].sort((a, b) => a.name.localeCompare(b.name))
      );
      setSelectedCategoryId(category.id);
      setNewCategoryName("");
      setIsNewCategoryOpen(false);
      toast.success("Categoría creada");
    } catch (error: any) {
      toast.error(error.message || "Error al crear categoría");
    } finally {
      setIsCreatingCategory(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          children || (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 h-12 w-12"
              title="Crear producto rápido"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )
        }
      />
      <DialogContent className="fixed inset-0 top-0 left-0 m-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-4 overflow-auto sm:inset-auto sm:top-1/2 sm:left-1/2 sm:m-auto sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-[#7b1f3a]" />
            Crear producto rápido
          </DialogTitle>
          <DialogDescription>
            Agregá un producto nuevo al catálogo sin salir de la venta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="quick-name">Nombre *</Label>
            <Input
              id="quick-name"
              name="name"
              placeholder="Ej: Malbec Reserva"
              required
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-brand">Marca / Bodega *</Label>
              <Input
                id="quick-brand"
                name="brand"
                placeholder="Ej: Trapiche"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-style">Variedad / Tipo *</Label>
              <Input
                id="quick-style"
                name="style"
                placeholder="Ej: Malbec"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categoría *</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={(value: string | null) => {
                if (value === "__new__") {
                  setIsNewCategoryOpen(true);
                } else if (value) {
                  setSelectedCategoryId(value);
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-costPrice">Precio de costo *</Label>
              <MoneyInput
                id="quick-costPrice"
                name="costPrice"
                placeholder="0,00"
                required
                onChange={setCostPrice}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-salePrice">Precio de venta *</Label>
              <MoneyInput
                id="quick-salePrice"
                name="salePrice"
                placeholder="0,00"
                required
                onChange={setSalePrice}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quick-currentStock">Stock inicial</Label>
              <Input
                id="quick-currentStock"
                name="currentStock"
                type="number"
                min="0"
                defaultValue="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-minStock">Stock mínimo</Label>
              <Input
                id="quick-minStock"
                name="minStock"
                type="number"
                min="0"
                defaultValue="0"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="order-2 sm:order-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white order-1 sm:order-2"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </form>

        {/* Nested new category dialog */}
        <Dialog open={isNewCategoryOpen} onOpenChange={setIsNewCategoryOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Nueva Categoría</DialogTitle>
              <DialogDescription>
                Creá una categoría para organizar tus productos.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quick-new-category">Nombre</Label>
                <Input
                  id="quick-new-category"
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
                    setIsNewCategoryOpen(false);
                    setNewCategoryName("");
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
      </DialogContent>
    </Dialog>
  );
}
