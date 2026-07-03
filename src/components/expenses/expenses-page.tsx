"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Tags,
  Calendar,
  DollarSign,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  createExpense,
  updateExpense,
  deleteExpense,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface ExpenseCategory {
  id: string;
  name: string;
  color?: string | null;
  _count?: { expenses: number };
}

interface Expense {
  id: string;
  concept: string;
  amount: any;
  date: any;
  notes?: string | null;
  categoryId?: string | null;
  category?: ExpenseCategory | null;
}

const presetColors = [
  "#7b1f3a",
  "#dc2626",
  "#ea580c",
  "#d97706",
  "#65a30d",
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#c026d3",
  "#be123c",
  "#52525b",
];

export function ExpensesPage({
  expenses,
  categories,
}: {
  expenses: Expense[];
  categories: ExpenseCategory[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    concept: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    categoryId: "",
  });
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", color: "" });
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesSearch = !search.trim() ||
        expense.concept.toLowerCase().includes(search.toLowerCase()) ||
        expense.notes?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || expense.categoryId === categoryFilter;
      const expenseDate = new Date(expense.date);
      const matchesFrom = !fromDate || expenseDate >= new Date(fromDate);
      const matchesTo = !toDate || expenseDate <= new Date(toDate);
      return matchesSearch && matchesCategory && matchesFrom && matchesTo;
    });
  }, [expenses, search, categoryFilter, fromDate, toDate]);

  const totalFiltered = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [filteredExpenses]
  );

  function openCreateExpense() {
    setEditingExpense(null);
    setExpenseForm({
      concept: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      categoryId: "",
    });
    setIsExpenseDialogOpen(true);
  }

  function openEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setExpenseForm({
      concept: expense.concept,
      amount: String(expense.amount),
      date: expense.date.split("T")[0],
      notes: expense.notes || "",
      categoryId: expense.categoryId || "",
    });
    setIsExpenseDialogOpen(true);
  }

  async function handleSubmitExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseForm.concept.trim()) {
      toast.error("El concepto es obligatorio");
      return;
    }
    const amount = Number(expenseForm.amount);
    if (!amount || amount <= 0) {
      toast.error("El monto debe ser mayor a cero");
      return;
    }

    setIsSubmittingExpense(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, {
          concept: expenseForm.concept,
          amount,
          date: expenseForm.date,
          notes: expenseForm.notes,
          categoryId: expenseForm.categoryId || null,
        });
        toast.success("Gasto actualizado");
      } else {
        await createExpense({
          concept: expenseForm.concept,
          amount,
          date: expenseForm.date,
          notes: expenseForm.notes,
          categoryId: expenseForm.categoryId || undefined,
        });
        toast.success("Gasto registrado");
      }
      setIsExpenseDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setIsSubmittingExpense(false);
    }
  }

  async function handleDeleteExpense(id: string) {
    setDeletingExpenseId(id);
    try {
      await deleteExpense(id);
      toast.success("Gasto eliminado");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    } finally {
      setDeletingExpenseId(null);
    }
  }

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryForm({ name: "", color: presetColors[0] });
    setIsCategoryDialogOpen(true);
  }

  function openEditCategory(category: ExpenseCategory) {
    setEditingCategory(category);
    setCategoryForm({ name: category.name, color: category.color || presetColors[0] });
    setIsCategoryDialogOpen(true);
  }

  async function handleSubmitCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setIsSubmittingCategory(true);
    try {
      if (editingCategory) {
        await updateExpenseCategory(editingCategory.id, {
          name: categoryForm.name,
          color: categoryForm.color,
        });
        toast.success("Categoría actualizada");
      } else {
        await createExpenseCategory({
          name: categoryForm.name,
          color: categoryForm.color,
        });
        toast.success("Categoría creada");
      }
      setIsCategoryDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setIsSubmittingCategory(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    setDeletingCategoryId(id);
    try {
      await deleteExpenseCategory(id);
      toast.success("Categoría eliminada");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar");
    } finally {
      setDeletingCategoryId(null);
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-AR");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Gastos
        </h2>
        <p className="text-muted-foreground">
          Administrá los gastos de tu vinoteca
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar gastos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsCategoryDialogOpen(true)}
            className="gap-2 w-full sm:w-auto"
          >
            <Tags className="h-4 w-4" />
            Categorías
          </Button>
          <Button
            onClick={openCreateExpense}
            size="lg"
            className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white gap-2 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Categoría</Label>
              <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value || "all")}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas">
                    {categoryFilter === "all"
                      ? "Todas"
                      : categories.find((c) => c.id === categoryFilter)?.name || "Todas"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Desde</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hasta</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                className="text-muted-foreground"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setFromDate("");
                  setToDate("");
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-border/50 bg-[#7b1f3a]/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#7b1f3a]" />
              <span className="text-sm font-medium text-muted-foreground">
                Total filtrado ({filteredExpenses.length} gastos)
              </span>
            </div>
            <span className="font-heading text-2xl font-bold text-[#7b1f3a]">
              {formatPrice(totalFiltered)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Receipt className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          No se encontraron gastos
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => {
                    const isDeleting = deletingExpenseId === expense.id;
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="text-sm whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {formatDate(expense.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{expense.concept}</span>
                        </TableCell>
                        <TableCell>
                          {expense.category ? (
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={{
                                borderColor: expense.category.color || undefined,
                                color: expense.category.color || undefined,
                              }}
                            >
                              {expense.category.name}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {expense.notes || "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-[#7b1f3a]">
                          {formatPrice(Number(expense.amount))}
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
                                    onClick={() => openEditExpense(expense)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar gasto</TooltipContent>
                              </Tooltip>

                              <ConfirmDialog
                                title="Eliminar gasto"
                                description={`¿Estás seguro de que querés eliminar el gasto "${expense.concept}"?`}
                                confirmText="Eliminar"
                                cancelText="Cancelar"
                                variant="destructive"
                                isLoading={isDeleting}
                                onConfirm={() => handleDeleteExpense(expense.id)}
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
                                    <TooltipContent>Eliminar gasto</TooltipContent>
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

      {/* Expense Dialog */}
      <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingExpense ? "Editar Gasto" : "Nuevo Gasto"}
            </DialogTitle>
            <DialogDescription>
              {editingExpense
                ? "Modificá los datos del gasto."
                : "Registrá un gasto del emprendimiento."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitExpense} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-concept">Concepto *</Label>
              <Input
                id="expense-concept"
                value={expenseForm.concept}
                onChange={(e) =>
                  setExpenseForm((prev) => ({ ...prev, concept: e.target.value }))
                }
                placeholder="Ej: Alquiler"
                autoFocus
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expense-amount">Monto *</Label>
                <Input
                  id="expense-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-date">Fecha *</Label>
                <Input
                  id="expense-date"
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category">Categoría</Label>
              <Select
                value={expenseForm.categoryId}
                onValueChange={(value) =>
                  setExpenseForm((prev) => ({ ...prev, categoryId: value || "" }))
                }
              >
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Sin categoría">
                    {expenseForm.categoryId
                      ? categories.find((c) => c.id === expenseForm.categoryId)?.name || "Sin categoría"
                      : "Sin categoría"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin categoría</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-notes">Notas</Label>
              <Input
                id="expense-notes"
                value={expenseForm.notes}
                onChange={(e) =>
                  setExpenseForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Opcional"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpenseDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingExpense}
                className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
              >
                {isSubmittingExpense && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingExpense ? "Guardar" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Categories Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Categorías de gastos</DialogTitle>
            <DialogDescription>
              Administrá las categorías para organizar tus gastos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <form onSubmit={handleSubmitCategory} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="category-name">Nombre *</Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ej: Servicios"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm((prev) => ({ ...prev, color }))}
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        categoryForm.color === color
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Color ${color}`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {editingCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryForm({ name: "", color: presetColors[0] });
                    }}
                  >
                    Cancelar edición
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
                >
                  {isSubmittingCategory && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingCategory ? "Guardar" : "Crear"}
                </Button>
              </div>
            </form>

            <div className="border-t border-border pt-4">
              {categories.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay categorías creadas
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-auto">
                  {categories.map((category) => {
                    const isDeleting = deletingCategoryId === category.id;
                    return (
                      <div
                        key={category.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 p-2.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: category.color || "#7b1f3a" }}
                          />
                          <span className="font-medium text-sm truncate">{category.name}</span>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
                            {category._count?.expenses || 0}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => openEditCategory(category)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <ConfirmDialog
                            title="Eliminar categoría"
                            description={`¿Eliminar "${category.name}"? Los gastos asociados quedarán sin categoría.`}
                            confirmText="Eliminar"
                            cancelText="Cancelar"
                            variant="destructive"
                            isLoading={isDeleting}
                            onConfirm={() => handleDeleteCategory(category.id)}
                            trigger={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
