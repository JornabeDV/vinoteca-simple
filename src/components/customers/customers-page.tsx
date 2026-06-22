"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Phone,
  Mail,
  Wallet,
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
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/lib/actions";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  dni?: string | null;
  address?: string | null;
  notes?: string | null;
  balance?: number;
}

export function CustomersPage({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dni: "",
    address: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.dni?.toLowerCase().includes(q)
    );
  }, [customers, search]);

  function openCreate() {
    setEditingCustomer(null);
    setFormData({ name: "", email: "", phone: "", dni: "", address: "", notes: "" });
    setIsDialogOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      dni: customer.dni || "",
      address: customer.address || "",
      notes: customer.notes || "",
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
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        toast.success("Cliente actualizado");
      } else {
        await createCustomer(formData);
        toast.success("Cliente creado");
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
      await deleteCustomer(id);
      toast.success("Cliente eliminado");
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
            placeholder="Buscar clientes..."
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
          Nuevo Cliente
        </Button>
      </div>

      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>DNI / CUIT</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          No se encontraron clientes
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const balance = customer.balance ?? 0;
                    const isDeleting = deletingId === customer.id;

                    return (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Link
                            href={`/clientes/${customer.id}`}
                            className="font-medium hover:text-[#7b1f3a] hover:underline"
                          >
                            {customer.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            {customer.phone && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {customer.phone}
                              </span>
                            )}
                            {customer.email && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {customer.dni || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={`gap-1 text-xs ${
                              balance > 0
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            <Wallet className="h-3 w-3" />
                            {formatPrice(balance)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => openEdit(customer)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog
                              title="Eliminar cliente"
                              description={`¿Estás seguro de que querés eliminar a "${customer.name}"? Se perderá el historial de cuenta corriente.`}
                              confirmText="Eliminar"
                              cancelText="Cancelar"
                              variant="destructive"
                              isLoading={isDeleting}
                              onConfirm={() => handleDelete(customer.id)}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-muted-foreground hover:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </div>
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
              {editingCustomer ? "Editar Cliente" : "Nuevo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Modificá los datos del cliente."
                : "Agregá un cliente para usar en cuenta corriente."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Nombre *</Label>
              <Input
                id="customer-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nombre completo"
                autoFocus
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Teléfono</Label>
                <Input
                  id="customer-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="11-5555-5555"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-dni">DNI / CUIT</Label>
                <Input
                  id="customer-dni"
                  value={formData.dni}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dni: e.target.value }))
                  }
                  placeholder="30123456"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input
                id="customer-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="cliente@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Dirección</Label>
              <Input
                id="customer-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, address: e.target.value }))
                }
                placeholder="Dirección opcional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-notes">Notas</Label>
              <Input
                id="customer-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Notas opcionales"
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
                {editingCustomer ? "Guardar" : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
