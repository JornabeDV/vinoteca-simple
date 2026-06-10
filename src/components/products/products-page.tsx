"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wine,
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Pencil,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { archiveProduct, activateProduct } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { ProductStatus } from "@prisma/client";

export function ProductsPage({ products }: { products: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sortKey, setSortKey] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const handleSearch = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set("search", value);
    else params.delete("search");
    router.push(`/productos?${params.toString()}`);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    if (typeof aVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  const handleArchive = async (id: string) => {
    try {
      await archiveProduct(id);
      toast.success("Producto archivado");
      router.refresh();
    } catch {
      toast.error("Error al archivar");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await activateProduct(id);
      toast.success("Producto activado");
      router.refresh();
    } catch {
      toast.error("Error al activar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Link href="/productos/nuevo">
          <Button size="lg" className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[80px]">Imagen</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Producto
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Bodega</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("salePrice")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Precio
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("currentStock")}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      Stock
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Wine className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          No se encontraron productos
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedProducts.map((product) => (
                    <TableRow key={product.id} className="group">
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
                            {product.varietal}
                            {product.vintage && ` · ${product.vintage}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {product.winery}
                      </TableCell>
                      <TableCell className="text-sm">
                        {product.category}
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Filter className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => window.location.href = `/productos/editar/${product.id}`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            {product.status === "ACTIVE" ? (
                              <DropdownMenuItem
                                onClick={() => handleArchive(product.id)}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archivar
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleActivate(product.id)}
                              >
                                <ArchiveRestore className="mr-2 h-4 w-4" />
                                Activar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
