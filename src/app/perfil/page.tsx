import { AppShell } from "@/components/layout/app-shell";
export const dynamic = "force-dynamic";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBusinessById } from "@/lib/auth-actions";
import { User, Mail, Shield, Calendar, Store, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const userData = user
    ? await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, name: true, email: true, role: true, createdAt: true, businessId: true },
      })
    : null;

  const business = userData?.businessId
    ? await getBusinessById(userData.businessId)
    : null;

  if (!userData) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-muted-foreground">No se encontró el usuario.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h2 className="font-heading text-2xl font-bold tracking-tight">
            Perfil
          </h2>
          <p className="text-muted-foreground">
            Información de tu cuenta
          </p>
        </div>

        {/* Info general */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-[#7b1f3a]" />
              Datos Personales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7b1f3a]">
                <span className="text-xl font-bold text-white">
                  {userData?.name?.charAt(0).toUpperCase() ||
                    userData?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <p className="font-medium text-lg">
                  {userData?.name || "Sin nombre"}
                </p>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    userData?.role === "OWNER"
                      ? "border-[#7b1f3a]/30 bg-[#7b1f3a]/5 text-[#7b1f3a]"
                      : "border-border bg-muted"
                  }`}
                >
                  <Shield className="mr-1 h-3 w-3" />
                  {userData?.role === "OWNER" ? "Propietario" : "Empleado"}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{userData?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rol</p>
                  <p className="font-medium">
                    {userData?.role === "OWNER" ? "Propietario" : "Empleado"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Fecha de Registro
                  </p>
                  <p className="font-medium">
                    {userData?.createdAt
                      ? new Date(userData.createdAt).toLocaleDateString("es-AR")
                      : "—"}
                  </p>
                </div>
              </div>
              {business && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                      <Store className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vinoteca</p>
                      <p className="font-medium">{business.name}</p>
                    </div>
                  </div>
                  {userData?.role === "OWNER" && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7b1f3a]/10">
                        <KeyRound className="h-4 w-4 text-[#7b1f3a]" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Código de invitación</p>
                        <p className="font-medium font-mono text-[#7b1f3a]">{business.inviteCode}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Formulario editable */}
        <ProfileForm user={{ id: userData.id, name: userData.name, email: userData.email }} />
      </div>
    </AppShell>
  );
}
