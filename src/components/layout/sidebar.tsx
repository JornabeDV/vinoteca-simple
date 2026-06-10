"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Wine,
  Package,
  ShoppingCart,
  Users,
  LogOut,
  Menu,
  ChevronRight,
  Store,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const ownerNavigation = [
  { name: "Panel general", href: "/", icon: LayoutDashboard, tourId: "nav-dashboard" as string | undefined },
  { name: "Vender", href: "/ventas/nueva", icon: ShoppingCart, tourId: "nav-ventas" },
  { name: "Historial", href: "/ventas", icon: History, tourId: "nav-historial" as string | undefined },
  { name: "Productos", href: "/productos", icon: Wine, tourId: "nav-productos" },
  { name: "Inventario", href: "/inventario", icon: Package, tourId: "nav-inventario" },
];

const employeeNavigation = [
  { name: "Vender", href: "/ventas/nueva", icon: ShoppingCart, tourId: "nav-ventas" },
  { name: "Historial", href: "/ventas", icon: History, tourId: "nav-historial" as string | undefined },
  { name: "Productos", href: "/productos", icon: Wine, tourId: "nav-productos" },
  { name: "Inventario", href: "/inventario", icon: Package, tourId: "nav-inventario" },
];

const adminNavigation = [
  { name: "Usuarios", href: "/usuarios", icon: Users, tourId: "nav-usuarios" as string | undefined },
];

function isRouteActive(
  pathname: string,
  href: string,
  allItems: { href: string }[]
) {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  // Don't mark as active if a more specific nav item matches
  return !allItems.some(
    (other) =>
      other.href !== href &&
      (pathname === other.href || pathname.startsWith(`${other.href}/`))
  );
}

export function DesktopSidebar({
  userRole,
  businessName,
}: {
  userRole?: string;
  businessName?: string | null;
}) {
  const pathname = usePathname();

  const navItems =
    userRole === "OWNER"
      ? [...ownerNavigation, ...adminNavigation]
      : employeeNavigation;

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-border lg:bg-card">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7b1f3a]">
              <Wine className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
                Vinoteca{" "}
                <span className="text-[#7b1f3a]">Simple</span>
              </span>
              {businessName && (
                <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                  {businessName}
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = isRouteActive(pathname, item.href, navItems);
            return (
              <Link
                key={item.name}
                href={item.href}
                data-tour-desktop={item.tourId}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#7b1f3a]/10 text-[#7b1f3a]"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors shrink-0",
                    isActive
                      ? "text-[#7b1f3a]"
                      : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span className="truncate">{item.name}</span>
                {isActive && (
                  <ChevronRight className="ml-auto h-4 w-4 text-[#7b1f3a] shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}

export function MobileSidebar({
  userRole,
  businessName,
}: {
  userRole?: string;
  businessName?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navItems =
    userRole === "OWNER"
      ? [...ownerNavigation, ...adminNavigation]
      : employeeNavigation;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        <div className="group/button inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#7b1f3a]/20 disabled:pointer-events-none disabled:opacity-50 h-11 w-11 sm:h-9 sm:w-9 hover:bg-accent hover:text-foreground cursor-pointer">
          <Menu className="h-5 w-5" />
        </div>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex flex-col h-full">
          <div className="flex h-16 items-center px-6 border-b border-border/50">
            <Link
              href="/"
              className="flex items-center gap-3"
              onClick={() => setOpen(false)}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7b1f3a]">
                <Wine className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-lg font-semibold tracking-tight">
                  Vinoteca <span className="text-[#7b1f3a]">Simple</span>
                </span>
                {businessName && (
                  <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {businessName}
                  </span>
                )}
              </div>
            </Link>
          </div>

          <nav className="flex-1 overflow-auto py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = isRouteActive(pathname, item.href, navItems);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  data-tour-mobile={item.tourId}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#7b1f3a]/10 text-[#7b1f3a]"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive
                        ? "text-[#7b1f3a]"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.name}
                  {isActive && (
                    <ChevronRight className="ml-auto h-4 w-4 text-[#7b1f3a] shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border p-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
