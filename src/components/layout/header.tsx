"use client";

import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "next-auth";
import { MobileSidebar } from "./sidebar";

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getPageTitle(pathname: string) {
  const map: Record<string, string> = {
    "/": "Dashboard",
    "/productos": "Productos",
    "/productos/nuevo": "Nuevo Producto",
    "/inventario": "Inventario",
    "/ventas": "Ventas",
    "/ventas/nueva": "Nueva Venta",
    "/usuarios": "Usuarios",
    "/perfil": "Perfil",
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
}: {
  user?: User & { role?: string };
  businessName?: string | null;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <MobileSidebar userRole={user?.role} businessName={businessName} />
      </div>

      <div className="flex flex-1 items-center justify-between">
        <div className="flex flex-col">
          <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
            {getPageTitle(pathname)}
          </h1>
          {businessName && (
            <p className="text-xs text-muted-foreground hidden sm:block">
              {businessName}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-[#7b1f3a] text-xs font-medium text-white">
                    {getInitials(user?.name || user?.email)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="text-xs capitalize text-[#7b1f3a]">
                    {user?.role === "OWNER" ? "Propietario" : "Empleado"}
                  </p>
                  {businessName && (
                    <p className="text-xs text-muted-foreground truncate">
                      {businessName}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => (window.location.href = "/perfil")}>
                Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => (window.location.href = "/api/auth/signout")}
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
