"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Package,
  Plus,
  Search,
  History,
  AlertTriangle,
  Download,
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
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ProductCombobox } from "./product-combobox";
import { useDataTable, SortState } from "@/hooks/use-data-table";
import { adjustStock } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { MovementType } from "@prisma/client";

export function InventoryPage({
  movements,
  products,
  userRole,
}: {
  movements: any[];
  products: any[];
  userRole?: string;
}) {
  const isOwner = userRole === "OWNER";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const activeTab = searchParams.get("tab") || "productos";
  const selectedProductId = searchParams.get("productId") || "";

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.push(`/inventario?${params.toString()}`, { scroll: false });
  };

  const selectProduct = (productId: string) => {
    const params = new URLSearchParams();
    params.set("tab", "historial");
    params.set("productId", productId);
    router.push(`/inventario?${params.toString()}`, { scroll: false });
  };

  const clearProductFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("productId");
    router.push(`/inventario?${params.toString()}`, { scroll: false });
  };

  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [movementType, setMovementType] = useState<MovementType>(MovementType.ADJUSTMENT);
  const [notes, setNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = () => {
    const headers = [
      "producto",
      "bodega",
      "categoria",
      "varietal",
      "stock_actual",
      "stock_minimo",
      "precio_venta",
    ];
    const rows = products.map((p) => [
      p.name || "",
      p.brand || "",
      p.category || "",
      p.style || "",
      (p.currentStock ?? "").toString(),
      (p.minStock ?? "").toString(),
      p.salePrice?.toString() || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const csvWithBom = "\ufeff" + csv;
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventario-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${products.length} productos exportados`);
  };

  const lowStockProducts = products.filter(
    (p) => p.status === "ACTIVE" && p.currentStock <= p.minStock
  );

  const {
    data: paginatedProducts,
    currentPage: productPage,
    totalPages: productTotalPages,
    totalItems: productTotalItems,
    sort: productSort,
    searchQuery: productSearch,
    setCurrentPage: setProductPage,
    handleSort: handleProductSort,
    handleSearch: handleProductSearch,
  } = useDataTable({
    data: products,
    itemsPerPage: 10,
    searchFn: (product, query) => {
      const q = query.toLowerCase();
      return (
        product.name?.toLowerCase().includes(q) ||
        product.winery?.toLowerCase().includes(q)
      );
    },
    sortFn: (a, b, sort: SortState) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      switch (sort.key) {
        case "name":
          return (a.name || "").localeCompare(b.name || "") * dir;
        case "winery":
          return (a.winery || "").localeCompare(b.winery || "") * dir;
        case "currentStock":
          return (Number(a.currentStock) - Number(b.currentStock)) * dir;
        case "minStock":
          return (Number(a.minStock) - Number(b.minStock)) * dir;
        default:
          return 0;
      }
    },
  });

  const filteredMovements = selectedProductId
    ? movements.filter((m) => m.productId === selectedProductId)
    : movements;

  const {
    data: paginatedMovements,
    currentPage: movementPage,
    totalPages: movementTotalPages,
    totalItems: movementTotalItems,
    sort: movementSort,
    searchQuery: movementSearch,
    setCurrentPage: setMovementPage,
    handleSort: handleMovementSort,
    handleSearch: handleMovementSearch,
  } = useDataTable({
    data: filteredMovements,
    itemsPerPage: 10,
    searchFn: (movement, query) => {
      const q = query.toLowerCase();
      return (
        movement.product?.name?.toLowerCase().includes(q) ||
        movement.product?.winery?.toLowerCase().includes(q) ||
        movement.user?.name?.toLowerCase().includes(q) ||
        movement.user?.email?.toLowerCase().includes(q)
      );
    },
    sortFn: (a, b, sort: SortState) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      switch (sort.key) {
        case "date":
          return (
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
            dir
          );
        case "product":
          return (
            (a.product?.name || "").localeCompare(b.product?.name || "") * dir
          );
        case "type":
          return (a.type || "").localeCompare(b.type || "") * dir;
        case "quantity":
          return (Number(a.quantity) - Number(b.quantity)) * dir;
        case "user":
          return (
            (a.user?.name || a.user?.email || "").localeCompare(
              b.user?.name || b.user?.email || ""
            ) * dir
          );
        default:
          return 0;
      }
    },
  });

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
            value={productSearch}
            onChange={(e) => handleProductSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {isOwner && (
            <>
              <Button
                variant="outline"
                size="lg"
                onClick={handleExport}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger
                data-tour="inventario-ajustar"
                render={
                  <Button
                    size="lg"
                    className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Ajustar Stock
                  </Button>
                }
              />
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
                        <SelectValue>
                          {{
                            [MovementType.PURCHASE]: "Compra (entrada)",
                            [MovementType.ADJUSTMENT]: "Ajuste (entrada)",
                            [MovementType.SALE]: "Venta (salida)",
                            [MovementType.CORRECTION]: "Corrección",
                          }[movementType]}
                        </SelectValue>
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
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className="space-y-6">
        <TabsList className="w-full max-w-full overflow-x-auto scrollbar-hide">
          <TabsTrigger value="productos" className="gap-2">
            <Package className="h-4 w-4" />
            Productos
          </TabsTrigger>
          <TabsTrigger value="alertas" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="sm:hidden">Stock</span>
            <span className="max-sm:hidden sm:block">Alertas de Stock</span>
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
                      <TableHead>
                        <SortableHeader
                          label="Producto"
                          sortKey="name"
                          sort={productSort}
                          onSort={handleProductSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Bodega"
                          sortKey="winery"
                          sort={productSort}
                          onSort={handleProductSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Stock Actual"
                          sortKey="currentStock"
                          sort={productSort}
                          onSort={handleProductSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Stock Mínimo"
                          sortKey="minStock"
                          sort={productSort}
                          onSort={handleProductSort}
                        />
                      </TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <Package className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No se encontraron productos
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedProducts.map((product) => (
                        <TableRow
                          key={product.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => selectProduct(product.id)}
                        >
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

              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/50 px-4 py-3 gap-3">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  Mostrando{" "}
                  <span className="font-medium text-foreground">
                    {Math.min((productPage - 1) * 10 + 1, productTotalItems)}–
                    {Math.min(productPage * 10, productTotalItems)}
                  </span>{" "}
                  de <span className="font-medium text-foreground">{productTotalItems}</span> productos
                </p>
                <Pagination
                  currentPage={productPage}
                  totalPages={productTotalPages}
                  onPageChange={setProductPage}
                />
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
            <CardContent className="p-0 space-y-4">
              <div className="px-4 pt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en historial..."
                    value={movementSearch}
                    onChange={(e) => handleMovementSearch(e.target.value)}
                    className="pl-9 h-10"
                  />
                </div>
                {selectedProductId && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {products.find((p) => p.id === selectedProductId)?.name || "Producto"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={clearProductFilter}
                    >
                      Limpiar filtro
                    </Button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <SortableHeader
                          label="Fecha"
                          sortKey="date"
                          sort={movementSort}
                          onSort={handleMovementSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Producto"
                          sortKey="product"
                          sort={movementSort}
                          onSort={handleMovementSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Tipo"
                          sortKey="type"
                          sort={movementSort}
                          onSort={handleMovementSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Cantidad"
                          sortKey="quantity"
                          sort={movementSort}
                          onSort={handleMovementSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Usuario"
                          sortKey="user"
                          sort={movementSort}
                          onSort={handleMovementSort}
                        />
                      </TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-32 text-center">
                          <History className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No hay movimientos registrados
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedMovements.map((movement) => (
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

              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/50 px-4 py-3 gap-3">
                <p className="text-sm text-muted-foreground text-center sm:text-left">
                  Mostrando{" "}
                  <span className="font-medium text-foreground">
                    {Math.min((movementPage - 1) * 10 + 1, movementTotalItems)}–
                    {Math.min(movementPage * 10, movementTotalItems)}
                  </span>{" "}
                  de <span className="font-medium text-foreground">{movementTotalItems}</span> movimientos
                </p>
                <Pagination
                  currentPage={movementPage}
                  totalPages={movementTotalPages}
                  onPageChange={setMovementPage}
                />
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
