import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Plus, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              Usuarios
            </h2>
            <p className="text-muted-foreground">
              Gestiona los usuarios del sistema
            </p>
          </div>
        </div>

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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
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
