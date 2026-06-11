"use client";

import { useState } from "react";
import { useDataTable } from "@/hooks/use-data-table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Building2,
  Users,
  Wine,
  ShoppingCart,
  Search,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { resetUserPassword } from "@/lib/admin-actions";
import { formatNumber } from "@/lib/utils";

interface BusinessUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string | Date;
}

interface Business {
  id: string;
  name: string;
  inviteCode: string;
  status: string;
  createdAt: string;
  _count: {
    users: number;
    products: number;
    sales: number;
  };
  users: BusinessUser[];
}

interface AdminDashboardProps {
  businesses: Business[];
}

export function AdminDashboard({ businesses }: AdminDashboardProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [usersOpen, setUsersOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<BusinessUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const {
    data: paginatedData,
    currentPage,
    totalPages,
    totalItems,
    searchQuery,
    handleSearch,
    setCurrentPage,
  } = useDataTable<Business>({
    data: businesses,
    itemsPerPage: 10,
    searchFn: (item, query) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.inviteCode.toLowerCase().includes(query.toLowerCase()),
  });

  const totalUsers = businesses.reduce((sum, b) => sum + b._count.users, 0);
  const totalProducts = businesses.reduce((sum, b) => sum + b._count.products, 0);
  const totalSales = businesses.reduce((sum, b) => sum + b._count.sales, 0);

  function handleOpenUsers(business: Business) {
    setSelectedBusiness(business);
    setUsersOpen(true);
  }

  function handleOpenReset(user: BusinessUser) {
    setSelectedUser(user);
    setNewPassword("");
    setResetOpen(true);
  }

  async function handleResetPassword() {
    if (!selectedUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setIsResetting(true);
    try {
      await resetUserPassword(selectedUser.id, newPassword);
      toast.success(`Contraseña actualizada para ${selectedUser.name || selectedUser.email}`);
      setResetOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar la contraseña");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-heading text-2xl font-bold tracking-tight">
          Panel de administración
        </h2>
        <p className="text-muted-foreground">
          Gestiona las vinotecas registradas en la plataforma
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7b1f3a]/10">
                <Building2 className="h-4 w-4 text-[#7b1f3a]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vinotecas</p>
                <p className="text-xl font-semibold">{formatNumber(businesses.length)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7b1f3a]/10">
                <Users className="h-4 w-4 text-[#7b1f3a]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Usuarios</p>
                <p className="text-xl font-semibold">{formatNumber(totalUsers)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7b1f3a]/10">
                <Wine className="h-4 w-4 text-[#7b1f3a]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Productos</p>
                <p className="text-xl font-semibold">{formatNumber(totalProducts)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7b1f3a]/10">
                <ShoppingCart className="h-4 w-4 text-[#7b1f3a]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ventas</p>
                <p className="text-xl font-semibold">{formatNumber(totalSales)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o código de invitación..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vinoteca</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead className="text-right">Usuarios</TableHead>
                  <TableHead className="text-right">Productos</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <Building2 className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {searchQuery
                          ? "No se encontraron vinotecas"
                          : "No hay vinotecas registradas"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((business) => (
                    <TableRow key={business.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7b1f3a]/10">
                            <Building2 className="h-4 w-4 text-[#7b1f3a]" />
                          </div>
                          <span className="font-medium">{business.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold tracking-wider text-[#7b1f3a]">
                          {business.inviteCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(business._count.users)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(business._count.products)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatNumber(business._count.sales)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            business.status === "ACTIVE"
                              ? "border-green-600/30 bg-green-50 text-green-700"
                              : "border-amber-600/30 bg-amber-50 text-amber-700"
                          }
                        >
                          {business.status === "ACTIVE" ? "Activa" : "Suspendida"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(business.createdAt).toLocaleDateString("es-AR")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenUsers(business)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Mostrando {formatNumber(paginatedData.length)} de {formatNumber(totalItems)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Dialog */}
      <Dialog open={usersOpen} onOpenChange={setUsersOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Usuarios de {selectedBusiness?.name}
            </DialogTitle>
            <DialogDescription>
              Gestiona los usuarios y restablece contraseñas
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {selectedBusiness?.users.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No hay usuarios</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedBusiness?.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7b1f3a]/10">
                        <User className="h-4 w-4 text-[#7b1f3a]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {user.name || "Sin nombre"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        <Badge
                          variant="outline"
                          className={`mt-1 text-xs ${
                            user.role === "OWNER"
                              ? "border-[#7b1f3a]/30 bg-[#7b1f3a]/5 text-[#7b1f3a]"
                              : "border-border bg-muted"
                          }`}
                        >
                          {user.role === "OWNER" ? (
                            <Shield className="mr-1 h-3 w-3" />
                          ) : (
                            <User className="mr-1 h-3 w-3" />
                          )}
                          {user.role === "OWNER" ? "Propietario" : "Empleado"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReset(user)}
                    >
                      <KeyRound className="h-3.5 w-3.5 mr-1" />
                      Cambiar clave
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Restablecer contraseña</DialogTitle>
            <DialogDescription>
              Asigná una nueva contraseña para{" "}
              <span className="font-medium">
                {selectedUser?.name || selectedUser?.email}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nueva contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button variant="outline" onClick={() => setResetOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={isResetting || !newPassword}
                className="bg-[#7b1f3a] text-white hover:bg-[#5a1530]"
              >
                {isResetting ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
