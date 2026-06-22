"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wine,
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Pencil,
  Trash2,
  Loader2,
  Download,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { useDataTable, SortState } from "@/hooks/use-data-table";
import { archiveProduct, activateProduct, deleteProduct } from "@/lib/actions";
import { ProductImportButton } from "./product-import-button";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export function ProductsPage({ products, userRole }: { products: any[]; userRole?: string }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const isOwner = userRole === "OWNER";

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.category?.id && p.category?.name) {
        map.set(p.category.id, p.category.name);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [products]);

  const filteredByCategory = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category?.id === selectedCategory);
  }, [products, selectedCategory]);

  const handleExport = () => {
    const headers = [
      "nombre",
      "bodega",
      "categoria",
      "varietal",
      "anada",
      "tipo",
      "precio_costo",
      "precio_venta",
      "stock",
      "stock_minimo",
      "descripcion",
    ];
    const rows = products.map((p) => [
      p.name || "",
      p.brand || "",
      p.category?.name || "",
      p.style || "",
      p.year || "",
      p.productType || "",
      p.costPrice || "",
      p.salePrice || "",
      p.currentStock || "",
      p.minStock || "",
      p.description || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    // Add BOM so Excel detects UTF-8 correctly
    const csvWithBom = "\ufeff" + csv;
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `productos-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${products.length} productos exportados`);
  };

  const {
    data: paginatedProducts,
    currentPage,
    totalPages,
    totalItems,
    sort,
    searchQuery,
    setCurrentPage,
    handleSort,
    handleSearch,
  } = useDataTable({
    data: filteredByCategory,
    itemsPerPage: 10,
    searchFn: (product, query) => {
      const q = query.toLowerCase();
      return (
        product.name?.toLowerCase().includes(q) ||
        product.brand?.toLowerCase().includes(q) ||
        product.category?.name?.toLowerCase().includes(q) ||
        product.style?.toLowerCase().includes(q) ||
        product.brand?.toLowerCase().includes(q)
      );
    },
    sortFn: (a, b, sort: SortState) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      switch (sort.key) {
        case "name":
          return (a.name || "").localeCompare(b.name || "") * dir;
        case "brand":
          return (a.brand || "").localeCompare(b.brand || "") * dir;
        case "category":
          return (a.category?.name || "").localeCompare(b.category?.name || "") * dir;
        case "salePrice":
          return (Number(a.salePrice) - Number(b.salePrice)) * dir;
        case "currentStock":
          return (Number(a.currentStock) - Number(b.currentStock)) * dir;
        case "status":
          return (a.status || "").localeCompare(b.status || "") * dir;
        default:
          return 0;
      }
    },
  });

  const handleArchive = async (id: string) => {
    setLoadingId(id);
    try {
      await archiveProduct(id);
      toast.success("Producto archivado");
      router.refresh();
    } catch {
      toast.error("Error al archivar");
    } finally {
      setLoadingId(null);
    }
  };

  const handleActivate = async (id: string) => {
    setLoadingId(id);
    try {
      await activateProduct(id);
      toast.success("Producto activado");
      router.refresh();
    } catch {
      toast.error("Error al activar");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      await deleteProduct(id);
      toast.success("Producto eliminado");
      router.refresh();
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              setSelectedCategory(value || "all");
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px] h-10">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isOwner && (
          <div className="flex flex-col sm:flex-row gap-2">
            <ProductImportButton />
            <Link href="/productos/actualizar-precios">
              <Button
                variant="outline"
                size="lg"
                className="gap-2 w-full sm:w-auto"
              >
                <TrendingUp className="h-4 w-4" />
                Precios
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <Link href="/productos/nuevo" data-tour="productos-nuevo">
              <Button size="lg" className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px]">Imagen</TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Producto"
                      sortKey="name"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Marca"
                      sortKey="brand"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Categoría"
                      sortKey="category"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Precio"
                      sortKey="salePrice"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Stock"
                      sortKey="currentStock"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Estado"
                      sortKey="status"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  {isOwner && <TableHead className="w-[140px] text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isOwner ? 8 : 7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Wine className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          No se encontraron productos
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => {
                    const isLoading = loadingId === product.id;
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                            ) : (
                              <Wine className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{product.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {product.style}
                              {product.year && ` · ${product.year}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {product.brand}
                        </TableCell>
                        <TableCell className="text-sm">
                          {product.category?.name || "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(Number(product.salePrice))}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              product.currentStock <= product.minStock
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "text-muted-foreground"
                            }`}
                          >
                            {product.currentStock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.status === "ACTIVE"
                                ? "default"
                                : "secondary"
                            }
                            className={`text-xs ${
                              product.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                                : ""
                            }`}
                          >
                            {product.status === "ACTIVE" ? "Activo" : "Archivado"}
                          </Badge>
                        </TableCell>
                        {isOwner && (
                          <TableCell>
                            <TooltipProvider delayDuration={200}>
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                                      onClick={() => router.push(`/productos/editar/${product.id}`)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar producto</TooltipContent>
                                </Tooltip>

                                {product.status === "ACTIVE" ? (
                                  <ConfirmDialog
                                    title="Archivar producto"
                                    description={`¿Estás seguro de que querés archivar "${product.name}"? Podés volver a activarlo después.`}
                                    confirmText="Archivar"
                                    cancelText="Cancelar"
                                    variant="default"
                                    isLoading={isLoading}
                                    onConfirm={() => handleArchive(product.id)}
                                    trigger={
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground cursor-pointer hover:text-amber-600"
                                          >
                                            <Archive className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Archivar producto</TooltipContent>
                                      </Tooltip>
                                    }
                                  />
                                ) : (
                                  <ConfirmDialog
                                    title="Activar producto"
                                    description={`¿Querés volver a activar "${product.name}"?`}
                                    confirmText="Activar"
                                    cancelText="Cancelar"
                                    variant="default"
                                    isLoading={isLoading}
                                    onConfirm={() => handleActivate(product.id)}
                                    trigger={
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground cursor-pointer hover:text-emerald-600"
                                          >
                                            <ArchiveRestore className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Activar producto</TooltipContent>
                                      </Tooltip>
                                    }
                                  />
                                )}

                                <ConfirmDialog
                                  title="Eliminar producto"
                                  description={`¿Estás seguro de que querés eliminar "${product.name}" permanentemente?`}
                                  confirmText="Eliminar"
                                  cancelText="Cancelar"
                                  variant="destructive"
                                  isLoading={isLoading}
                                  onConfirm={() => handleDelete(product.id)}
                                  trigger={
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-muted-foreground cursor-pointer hover:text-destructive"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Eliminar permanentemente</TooltipContent>
                                    </Tooltip>
                                  }
                                />
                              </div>
                            </TooltipProvider>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/50 px-4 py-3 gap-3">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {Math.min((currentPage - 1) * 10 + 1, totalItems)}–
                {Math.min(currentPage * 10, totalItems)}
              </span>{" "}
              de <span className="font-medium text-foreground">{totalItems}</span> productos
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
