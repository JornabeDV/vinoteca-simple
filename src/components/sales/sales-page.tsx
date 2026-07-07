"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  Download,
  Pencil,
  Trash2,
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
import { formatPrice, getPaymentMethodLabel } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { BackButton } from "@/components/ui/back-button";
import { deleteSale } from "@/lib/actions";

export function SalesPage({ sales, userRole }: { sales: any[]; userRole?: string }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const isOwner = userRole === "OWNER";
  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      await deleteSale(id);
      toast.success("Venta eliminada");
      router.refresh();
    } catch {
      toast.error("Error al eliminar la venta");
    } finally {
      setLoadingId(null);
    }
  };

  const handleExport = () => {
    const headers = ["numero", "fecha", "usuario", "cliente", "forma de pago", "productos", "descuento", "total"];
    const rows = sales.map((s) => [
      s.saleNumber || "",
      s.createdAt ? new Date(s.createdAt).toLocaleString("es-AR") : "",
      s.user?.name || s.user?.email || "",
      s.customer?.name || "",
      getPaymentMethodLabel(s.paymentMethod),
      (s.items?.length || 0).toString(),
      `${s.discountPercentage || 0}%`,
      s.totalAmount?.toString() || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const csvWithBom = "\ufeff" + csv;
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ventas-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${sales.length} ventas exportadas`);
  };

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
        sale.user?.email?.toLowerCase().includes(q) ||
        sale.customer?.name?.toLowerCase().includes(q)
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
      <div className="flex flex-col gap-2">
        <BackButton href="/ventas/nueva" />
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Historial de ventas
          </h2>
          <p className="text-muted-foreground">
            Consultá y gestioná las ventas realizadas
          </p>
        </div>
      </div>

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
        <div className="flex flex-col sm:flex-row gap-2">
          {isOwner && (
            <Button
              variant="outline"
              size="lg"
              onClick={handleExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          )}
          <Link href="/ventas/nueva" data-tour="ventas-nueva">
            <Button size="lg" className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2 w-full sm:w-auto px-6">
              <ShoppingCart className="h-5 w-5" />
              Vender
            </Button>
          </Link>
        </div>
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
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pago</TableHead>
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
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-32 text-center">
                      <ShoppingCart className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No se encontraron ventas
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSales.map((sale) => (
                    <TableRow
                      key={sale.id}
                      className="group cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/ventas/detalle/${sale.id}`)}
                    >
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
                      <TableCell className="text-sm">
                        {sale.customer ? (
                          <span>{sale.customer.name}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            sale.isPaid
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {sale.items?.length || 0} productos
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatPrice(Number(sale.totalAmount))}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link href={`/ventas/detalle/${sale.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="p-0 cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent>Ver detalle</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {isOwner && (
                            <>
                              <TooltipProvider delayDuration={200}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="p-0 cursor-pointer"
                                      onClick={() => router.push(`/ventas/editar/${sale.id}`)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar venta</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <ConfirmDialog
                                title="Eliminar venta"
                                description={`¿Estás seguro de que querés eliminar la venta ${sale.saleNumber}? Se revertirá el stock de los productos.`}
                                confirmText="Eliminar"
                                cancelText="Cancelar"
                                variant="destructive"
                                isLoading={loadingId === sale.id}
                                onConfirm={() => handleDelete(sale.id)}
                                trigger={
                                  <TooltipProvider delayDuration={200}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="p-0 cursor-pointer"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Eliminar venta</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                }
                              />
                            </>
                          )}
                        </div>
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
