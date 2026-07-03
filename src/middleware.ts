import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes: only ADMIN allowed
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Redirect admin away from business routes to admin panel
    if (token?.role === "ADMIN" && !path.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }

    // Dashboard is owner-only
    if (path.startsWith("/dashboard") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/ventas/nueva", req.url));
    }

    // Protect admin-only routes (within a business)
    if (path.startsWith("/usuarios") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/ventas", req.url));
    }
    if (path.startsWith("/productos/nuevo") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/productos", req.url));
    }
    if (path.startsWith("/productos/editar") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/productos", req.url));
    }
    if (path.startsWith("/categorias") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/productos", req.url));
    }
    if (path.startsWith("/clientes") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/ventas", req.url));
    }
    if (path.startsWith("/proveedores") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/ventas", req.url));
    }
    if (path.startsWith("/gastos") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/ventas", req.url));
    }
    if (path.startsWith("/compras") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/ventas", req.url));
    }
    if (path.startsWith("/productos/actualizar-precios") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/productos", req.url));
    }
    if (path.startsWith("/mi-vinoteca") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/ventas/nueva", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/productos/:path*",
    "/inventario/:path*",
    "/ventas/:path*",
    "/usuarios/:path*",
    "/perfil/:path*",
    "/categorias/:path*",
    "/clientes/:path*",
    "/proveedores/:path*",
    "/gastos/:path*",
    "/compras/:path*",
    "/mi-vinoteca/:path*",
  ],
};
