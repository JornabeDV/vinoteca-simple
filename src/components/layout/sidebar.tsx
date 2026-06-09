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
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Productos", href: "/productos", icon: Wine },
  { name: "Inventario", href: "/inventario", icon: Package },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart },
];

const adminNavigation = [
  { name: "Usuarios", href: "/usuarios", icon: Users },
];

export function Sidebar({ userRole }: { userRole?: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems =
    userRole === "OWNER"
      ? [...navigation, ...adminNavigation]
      : navigation;

  const NavContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7b1f3a]">
            <Wine className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-lg font-semibold tracking-tight text-foreground">
              Vinoteca
              <span className="text-[#7b1f3a]">OS</span>
            </span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-[#7b1f3a]/10 text-[#7b1f3a]"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-[#7b1f3a]" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.name}
                {isActive && (
                  <ChevronRight className="ml-auto h-4 w-4 text-[#7b1f3a]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

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
  );

  return (
    <>
      {/* Mobile */}
      <div className="lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            {NavContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-border lg:bg-card">
        {NavContent}
      </div>
    </>
  );
}
