"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "next-auth";
import { MobileSidebar } from "./sidebar";
import { useTour } from "@/components/onboarding/tour-context";
import { resetTourState } from "@/components/onboarding/tour-steps";
import { Sparkles } from "lucide-react";

function RestartTourItem() {
  const { startTour } = useTour();
  return (
    <DropdownMenuItem
      onClick={() => {
        resetTourState();
        startTour();
      }}
      className="gap-2"
    >
      <Sparkles className="h-3.5 w-3.5 text-[#7b1f3a]" />
      Reiniciar tour
    </DropdownMenuItem>
  );
}

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleLabel(role?: string) {
  if (role === "ADMIN") return "Administrador";
  if (role === "OWNER") return "Propietario";
  return "Empleado";
}

function getPageTitle(pathname: string) {
  const map: Record<string, string> = {
    "/": "Nueva Venta",
    "/dashboard": "Panel general",
    "/admin": "Panel de administración",
    "/productos": "Productos",
    "/productos/nuevo": "Nuevo Producto",
    "/inventario": "Inventario",
    "/ventas": "Ventas",
    "/ventas/nueva": "Nueva Venta",
    "/usuarios": "Usuarios",
    "/perfil": "Perfil",
    "/mi-vinoteca": "Mi Vinoteca",
  };
  if (pathname.startsWith("/productos/editar/")) {
    return "Editar Producto";
  }
  if (pathname.startsWith("/ventas/detalle/")) {
    return "Detalle de Venta";
  }
  return map[pathname] || "Vinoteca Simple";
}

export function Header({
  user,
  businessName,
  businessLogo,
}: {
  user?: User & { role?: string };
  businessName?: string | null;
  businessLogo?: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <MobileSidebar userRole={user?.role} businessName={businessName} businessLogo={businessLogo} />
      </div>

      <div className="flex flex-1 items-center justify-between">
        <div className="flex flex-col">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            {businessName || getPageTitle(pathname)}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-lg" className="relative rounded-full p-0" data-tour="header-perfil">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className="bg-[#7b1f3a] text-xs font-medium text-white">
                      {getInitials(user?.name || user?.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              }
            />
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name || user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs capitalize text-[#7b1f3a]">
                      {getRoleLabel(user?.role)}
                    </p>
                    {businessName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {businessName}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              {user?.role !== "ADMIN" && (
                <DropdownMenuItem onClick={() => (window.location.href = "/perfil")}>
                  Perfil
                </DropdownMenuItem>
              )}
              {user?.role !== "ADMIN" && <DropdownMenuSeparator />}
              {user?.role !== "ADMIN" && <RestartTourItem />}
              {user?.role !== "ADMIN" && <DropdownMenuSeparator />}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
