import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getBusinessById } from "@/lib/auth-actions";
import { Users, Shield, User, KeyRound } from "lucide-react";
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
import { CreateEmployeeDialog } from "./create-employee-dialog";
import { DeleteUserButton } from "./delete-user-button";

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser?.businessId) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-96">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-muted-foreground">
            No pertenecés a ningún negocio.
          </p>
        </div>
      </AppShell>
    );
  }

  const businessId = currentUser.businessId;

  const [users, business] = await Promise.all([
    prisma.user.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    }),
    getBusinessById(businessId),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Usuarios
            </h2>
            <p className="text-muted-foreground">
              Gestiona los usuarios de tu vinoteca
            </p>
          </div>
          <CreateEmployeeDialog />
        </div>

        {business && (
          <Card className="border-border/50 bg-muted/30">
            <CardContent className="py-4 px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7b1f3a]/10">
                  <KeyRound className="h-4 w-4 text-[#7b1f3a]" />
                </div>
                <div>
                  <p className="text-sm font-medium">Código de invitación</p>
                  <p className="text-lg font-mono font-semibold tracking-wider text-[#7b1f3a]">
                    {business.inviteCode}
                  </p>
                </div>
                <p className="ml-auto text-xs text-muted-foreground hidden sm:block">
                  Compartí este código para que empleados se unan
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Fecha de Registro</TableHead>
                    <TableHead className="w-16">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No hay usuarios registrados
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7b1f3a]/10">
                              <User className="h-4 w-4 text-[#7b1f3a]" />
                            </div>
                            <span className="font-medium">
                              {user.name || "Sin nombre"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
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
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(user.createdAt).toLocaleDateString("es-AR")}
                        </TableCell>
                        <TableCell>
                          {user.role === "EMPLOYEE" && user.id !== currentUser.id && (
                            <DeleteUserButton
                              userId={user.id}
                              userName={user.name || user.email}
                            />
                          )}
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
    </AppShell>
  );
}
