"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Package,
  Plus,
  Minus,
  Search,
  History,
  ArrowUpDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCombobox } from "./product-combobox";
import { adjustStock } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { MovementType } from "@prisma/client";

export function InventoryPage({
  movements,
  products,
}: {
  movements: any[];
  products: any[];
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [movementType, setMovementType] = useState<MovementType>(MovementType.ADJUSTMENT);
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filteredProducts = products.filter(
    (p) =>
      p.status === "ACTIVE" &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.winery.toLowerCase().includes(search.toLowerCase()))
  );

  const lowStockProducts = products.filter(
    (p) => p.status === "ACTIVE" && p.currentStock <= p.minStock
  );

  async function handleAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProduct || !quantity || !session?.user?.id) return;

    setIsLoading(true);
    try {
      const qty =
        movementType === MovementType.SALE
          ? -Math.abs(parseInt(quantity))
          : Math.abs(parseInt(quantity));

      await adjustStock({
        productId: selectedProduct,
        userId: session.user.id,
        quantity: qty,
        type: movementType,
        notes: notes || undefined,
      });

      toast.success("Movimiento registrado");
      setIsDialogOpen(false);
      setSelectedProduct("");
      setQuantity("");
      setNotes("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar movimiento");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button size="lg" className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2">
              <Plus className="h-4 w-4" />
              Ajustar Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Ajustar Stock</DialogTitle>
              <DialogDescription>
                Registra un movimiento de inventario
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdjustment} className="space-y-4">
              <div className="space-y-2">
                <Label>Producto</Label>
                <ProductCombobox
                  products={products.filter((p) => p.status === "ACTIVE")}
                  value={selectedProduct}
                  onChange={setSelectedProduct}
                  placeholder="Seleccionar producto..."
                />
                {selectedProduct && (
                  <p className="text-xs text-muted-foreground">
                    Stock actual:{" "}
                    <span className="font-medium text-foreground">
                      {products.find((p) => p.id === selectedProduct)?.currentStock} unidades
                    </span>
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tipo de Movimiento</Label>
                <Select
                  value={movementType}
                  onValueChange={(v) => setMovementType((v as MovementType) || MovementType.ADJUSTMENT)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={MovementType.PURCHASE}>
                      Compra (entrada)
                    </SelectItem>
                    <SelectItem value={MovementType.ADJUSTMENT}>
                      Ajuste (entrada)
                    </SelectItem>
                    <SelectItem value={MovementType.SALE}>
                      Venta (salida)
                    </SelectItem>
                    <SelectItem value={MovementType.CORRECTION}>
                      Corrección
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cantidad</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Cantidad"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones opcionales..."
                  rows={2}
                />
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Registrando..." : "Registrar Movimiento"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="productos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="productos" className="gap-2">
            <Package className="h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas de Stock
            {lowStockProducts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1">
                {lowStockProducts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="productos">
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Bodega</TableHead>
                      <TableHead>Stock Actual</TableHead>
                      <TableHead>Stock Mínimo</TableHead>
                      <TableHead>Estado</TableHead>
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
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{product.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {product.varietal}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{product.winery}</TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                product.currentStock <= product.minStock
                                  ? "text-amber-600"
                                  : ""
                              }`}
                            >
                              {product.currentStock}
                            </span>
                          </TableCell>
                          <TableCell>{product.minStock}</TableCell>
                          <TableCell>
                            {product.currentStock <= product.minStock ? (
                              <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-amber-700"
                              >
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Bajo
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-emerald-700"
                              >
                                OK
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alertas">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Productos con Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No hay productos con stock bajo
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-amber-200/60 bg-amber-50/50 p-4"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.winery} · {product.varietal}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-700">
                          {product.currentStock}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          mín: {product.minStock}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial">
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <History className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No hay movimientos registrados
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-sm whitespace-nowrap">
                            {new Date(movement.createdAt).toLocaleString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {movement.product?.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {movement.product?.winery}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <MovementBadge type={movement.type} />
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                movement.quantity > 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {movement.quantity > 0 ? "+" : ""}
                              {movement.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm">
                            {movement.user?.name || movement.user?.email}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {movement.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MovementBadge({ type }: { type: MovementType }) {
  const styles: Record<MovementType, string> = {
    PURCHASE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    SALE: "border-blue-200 bg-blue-50 text-blue-700",
    ADJUSTMENT: "border-amber-200 bg-amber-50 text-amber-700",
    CORRECTION: "border-gray-200 bg-gray-50 text-gray-700",
  };

  const labels: Record<MovementType, string> = {
    PURCHASE: "Compra",
    SALE: "Venta",
    ADJUSTMENT: "Ajuste",
    CORRECTION: "Corrección",
  };

  return (
    <Badge variant="outline" className={styles[type]}>
      {labels[type]}
    </Badge>
  );
}
