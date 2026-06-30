"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Tag,
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Pencil,
  Trash2,
  Loader2,
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
import { archivePromotion, activatePromotion, deletePromotion } from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export function PromosPage({ promotions, userRole }: { promotions: any[]; userRole?: string }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const isOwner = userRole === "OWNER";

  const {
    data: paginatedPromos,
    currentPage,
    totalPages,
    totalItems,
    sort,
    searchQuery,
    setCurrentPage,
    handleSort,
    handleSearch,
  } = useDataTable({
    data: promotions,
    itemsPerPage: 10,
    searchFn: (promo, query) => {
      const q = query.toLowerCase();
      return (
        promo.name?.toLowerCase().includes(q) ||
        promo.description?.toLowerCase().includes(q) ||
        promo.items?.some((i: any) => i.product?.name?.toLowerCase().includes(q))
      );
    },
    sortFn: (a, b, sort: SortState) => {
      const dir = sort.direction === "asc" ? 1 : -1;
      switch (sort.key) {
        case "name":
          return (a.name || "").localeCompare(b.name || "") * dir;
        case "salePrice":
          return (Number(a.salePrice) - Number(b.salePrice)) * dir;
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
      await archivePromotion(id);
      toast.success("Promoción archivada");
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
      await activatePromotion(id);
      toast.success("Promoción activada");
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
      await deletePromotion(id);
      toast.success("Promoción eliminada");
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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar promos..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        {isOwner && (
          <Link href="/promos/nueva">
            <Button size="lg" className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Nueva Promo
            </Button>
          </Link>
        )}
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <SortableHeader label="Promo" sortKey="name" sort={sort} onSort={handleSort} />
                  </TableHead>
                  <TableHead>Productos incluidos</TableHead>
                  <TableHead>
                    <SortableHeader label="Precio" sortKey="salePrice" sort={sort} onSort={handleSort} />
                  </TableHead>
                  <TableHead>
                    <SortableHeader label="Estado" sortKey="status" sort={sort} onSort={handleSort} />
                  </TableHead>
                  {isOwner && <TableHead className="w-[140px] text-right">Acciones</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPromos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isOwner ? 5 : 4} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Tag className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">No se encontraron promociones</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedPromos.map((promo) => {
                    const isLoading = loadingId === promo.id;
                    return (
                      <TableRow key={promo.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{promo.name}</span>
                            {promo.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {promo.description}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            {promo.items?.map((item: any) => (
                              <span key={item.id} className="text-muted-foreground">
                                {item.quantity} × {item.product?.name}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(Number(promo.salePrice))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={promo.status === "ACTIVE" ? "default" : "secondary"}
                            className={`text-xs ${
                              promo.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200"
                                : ""
                            }`}
                          >
                            {promo.status === "ACTIVE" ? "Activa" : "Archivada"}
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
                                      onClick={() => router.push(`/promos/editar/${promo.id}`)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Editar promo</TooltipContent>
                                </Tooltip>

                                {promo.status === "ACTIVE" ? (
                                  <ConfirmDialog
                                    title="Archivar promoción"
                                    description={`¿Archivar "${promo.name}"? Podés volver a activarla después.`}
                                    confirmText="Archivar"
                                    cancelText="Cancelar"
                                    variant="default"
                                    isLoading={isLoading}
                                    onConfirm={() => handleArchive(promo.id)}
                                    trigger={
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-amber-600 cursor-pointer"
                                          >
                                            <Archive className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Archivar promo</TooltipContent>
                                      </Tooltip>
                                    }
                                  />
                                ) : (
                                  <ConfirmDialog
                                    title="Activar promoción"
                                    description={`¿Volver a activar "${promo.name}"?`}
                                    confirmText="Activar"
                                    cancelText="Cancelar"
                                    variant="default"
                                    isLoading={isLoading}
                                    onConfirm={() => handleActivate(promo.id)}
                                    trigger={
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-emerald-600 cursor-pointer"
                                          >
                                            <ArchiveRestore className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Activar promo</TooltipContent>
                                      </Tooltip>
                                    }
                                  />
                                )}

                                <ConfirmDialog
                                  title="Eliminar promoción"
                                  description={`¿Eliminar "${promo.name}" permanentemente?`}
                                  confirmText="Eliminar"
                                  cancelText="Cancelar"
                                  variant="destructive"
                                  isLoading={isLoading}
                                  onConfirm={() => handleDelete(promo.id)}
                                  trigger={
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-muted-foreground hover:text-destructive cursor-pointer"
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
              de <span className="font-medium text-foreground">{totalItems}</span> promociones
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
