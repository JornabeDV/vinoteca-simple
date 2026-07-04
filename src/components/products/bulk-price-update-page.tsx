"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Percent,
  DollarSign,
  Check,
  Loader2,
  Search,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { bulkUpdatePrices } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

interface Product {
  id: string;
  name: string;
  brand: string;
  category?: { name: string } | null;
  salePrice: number;
  costPrice: number;
  currentStock: number;
  status: string;
}

export function BulkPriceUpdatePage({ products }: { products: Product[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updateType, setUpdateType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState<string>("");
  const [roundTo100, setRoundTo100] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === "ACTIVE"),
    [products]
  );

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return activeProducts;
    const q = search.toLowerCase();
    return activeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q)
    );
  }, [activeProducts, search]);

  const allSelected =
    filteredProducts.length > 0 &&
    filteredProducts.every((p) => selectedIds.has(p.id));

  function toggleAll() {
    if (allSelected) {
      const next = new Set(selectedIds);
      filteredProducts.forEach((p) => next.delete(p.id));
      setSelectedIds(next);
    } else {
      const next = new Set(selectedIds);
      filteredProducts.forEach((p) => next.add(p.id));
      setSelectedIds(next);
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  const selectedProducts = useMemo(
    () => activeProducts.filter((p) => selectedIds.has(p.id)),
    [activeProducts, selectedIds]
  );

  const numericValue = parseFloat(value.replace(",", ".")) || 0;

  function calculateNewPrice(product: Product): number {
    let newPrice: number;
    if (updateType === "percentage") {
      newPrice = Number(product.salePrice) * (1 + numericValue / 100);
    } else {
      newPrice = Number(product.salePrice) + numericValue;
    }
    if (roundTo100) {
      newPrice = Math.round(newPrice / 100) * 100;
    } else {
      newPrice = Math.round(newPrice);
    }
    return Math.max(newPrice, Number(product.costPrice));
  }

  async function handleSubmit() {
    if (selectedIds.size === 0) {
      toast.error("Seleccioná al menos un producto");
      return;
    }
    if (numericValue <= 0) {
      toast.error("Ingresá un valor mayor a cero");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await bulkUpdatePrices({
        productIds: Array.from(selectedIds),
        type: updateType,
        value: numericValue,
        roundTo100,
      });
      toast.success(`${result.count} productos actualizados`);
      router.push("/productos");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar precios");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <BackButton href="/productos" />
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Actualizar Precios
          </h2>
          <p className="text-muted-foreground">
            Aplicá aumentos masivos a los productos seleccionados
          </p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="space-y-4">
          <h3 className="font-heading text-lg font-semibold">Opciones</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de aumento</Label>
              <div className="flex rounded-lg border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setUpdateType("percentage")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                    updateType === "percentage"
                      ? "bg-[#7b1f3a] text-white"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  <Percent className="h-4 w-4" />
                  Porcentaje
                </button>
                <button
                  type="button"
                  onClick={() => setUpdateType("fixed")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
                    updateType === "fixed"
                      ? "bg-[#7b1f3a] text-white"
                      : "bg-background hover:bg-muted"
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                  Monto fijo
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">
                {updateType === "percentage" ? "Porcentaje (%)" : "Monto ($)"}
              </Label>
              <Input
                id="value"
                type="number"
                min="0"
                step={updateType === "percentage" ? "0.1" : "1"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={updateType === "percentage" ? "Ej: 15" : "Ej: 1000"}
              />
            </div>
            <div className="space-y-2 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={roundTo100}
                  onCheckedChange={(checked) => setRoundTo100(!!checked)}
                />
                <span className="text-sm">Redondear a múltiplos de $100</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar productos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedIds.size} seleccionados
            </div>
          </div>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Seleccionar todos"
                    />
                  </TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio Actual</TableHead>
                  <TableHead className="text-right">Nuevo Precio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No se encontraron productos
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const newPrice = calculateNewPrice(product);
                    const isSelected = selectedIds.has(product.id);

                    return (
                      <TableRow
                        key={product.id}
                        className={isSelected ? "bg-[#7b1f3a]/5" : ""}
                        onClick={() => toggleOne(product.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOne(product.id)}
                            aria-label={`Seleccionar ${product.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {product.brand}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {product.category?.name || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatPrice(Number(product.salePrice))}
                        </TableCell>
                        <TableCell className="text-right">
                          {isSelected ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-emerald-700"
                            >
                              {formatPrice(newPrice)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
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

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link href="/productos" className="w-full sm:w-auto">
          <Button variant="outline" size="xl" className="w-full">
            Cancelar
          </Button>
        </Link>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedIds.size === 0 || numericValue <= 0}
          size="xl"
          className="w-full bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2 sm:w-auto"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Aplicar a {selectedIds.size} productos
        </Button>
      </div>
    </div>
  );
}
