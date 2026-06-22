"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tags,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Package,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  _count?: { products: number };
}

export function CategoriesPage({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [categories, search]);

  function openCreate() {
    setEditingCategory(null);
    setFormData({ name: "", description: "" });
    setIsDialogOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description,
        });
        toast.success("Categoría actualizada");
      } else {
        await createCategory({
          name: formData.name,
          description: formData.description,
        });
        toast.success("Categoría creada");
      }
      setIsDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteCategory(id);
      toast.success("Categoría eliminada");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar categorías..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <Button
          onClick={openCreate}
          size="lg"
          className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-[120px]">Productos</TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Tags className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          No se encontraron categorías
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => {
                    const productCount = category._count?.products || 0;
                    const isDeleting = deletingId === category.id;

                    return (
                      <TableRow key={category.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {category.description || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="gap-1 text-xs"
                          >
                            <Package className="h-3 w-3" />
                            {productCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider delayDuration={200}>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                                    onClick={() => openEdit(category)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar categoría</TooltipContent>
                              </Tooltip>

                              <ConfirmDialog
                                title="Eliminar categoría"
                                description={`¿Estás seguro de que querés eliminar "${category.name}"? Los productos asociados quedarán sin categoría.`}
                                confirmText="Eliminar"
                                cancelText="Cancelar"
                                variant="destructive"
                                isLoading={isDeleting}
                                onConfirm={() => handleDelete(category.id)}
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
                                    <TooltipContent>Eliminar categoría</TooltipContent>
                                  </Tooltip>
                                }
                              />
                            </div>
                          </TooltipProvider>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Modificá los datos de la categoría."
                : "Creá una categoría para organizar tus productos."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nombre *</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ej: Vino Tinto"
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Descripción</Label>
              <Input
                id="category-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Opcional"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingCategory ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
