"use client";

import Link from "next/link";

import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
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
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { useDataTable, SortState } from "@/hooks/use-data-table";
import { formatPrice } from "@/lib/utils";

export function SalesPage({ sales }: { sales: any[] }) {
  const {
    data: paginatedSales,
    currentPage,
    totalPages,
    totalItems,
    sort,
    searchQuery,
    setCurrentPage,
    handleSort,
    handleSearch,
  } = useDataTable({
    data: sales,
    itemsPerPage: 10,
    searchFn: (sale, query) => {
      const q = query.toLowerCase();
      return (
        sale.saleNumber?.toLowerCase().includes(q) ||
        sale.user?.name?.toLowerCase().includes(q) ||
        sale.user?.email?.toLowerCase().includes(q)
      );
    },
    sortFn: (a, b, sort: SortState) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      switch (sort.key) {
        case "number":
          return a.saleNumber.localeCompare(b.saleNumber) * dir;
        case "date":
          return (
            (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
            dir
          );
        case "user":
          return (
            (a.user?.name || a.user?.email || "").localeCompare(
              b.user?.name || b.user?.email || ""
            ) * dir
          );
        case "products":
          return ((a.items?.length || 0) - (b.items?.length || 0)) * dir;
        case "total":
          return (Number(a.totalAmount) - Number(b.totalAmount)) * dir;
        default:
          return 0;
      }
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar ventas..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Link href="/ventas/nueva" data-tour="ventas-nueva">
          <Button size="lg" className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2">
            <Plus className="h-4 w-4" />
            Nueva Venta
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortableHeader
                      label="Número"
                      sortKey="number"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Fecha"
                      sortKey="date"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Usuario"
                      sortKey="user"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Productos"
                      sortKey="products"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <SortableHeader
                      label="Total"
                      sortKey="total"
                      sort={sort}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No se encontraron ventas
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSales.map((sale) => (
                    <TableRow key={sale.id} className="group">
                      <TableCell>
                        <span className="font-medium">{sale.saleNumber}</span>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(sale.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {sale.user?.name || sale.user?.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {sale.items?.length || 0} productos
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(Number(sale.totalAmount))}
                      </TableCell>
                      <TableCell>
                        <Link href={`/ventas/detalle/${sale.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                {Math.min((currentPage - 1) * 10 + 1, totalItems)}–
                {Math.min(currentPage * 10, totalItems)}
              </span>{" "}
              de <span className="font-medium text-foreground">{totalItems}</span> ventas
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
