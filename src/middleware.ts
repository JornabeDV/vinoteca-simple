import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect employees away from dashboard
    if (path === "/" && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/ventas", req.url));
    }

    // Protect admin-only routes
    if (path.startsWith("/usuarios") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/ventas", req.url));
    }
    if (path.startsWith("/productos/nuevo") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/productos", req.url));
    }
    if (path.startsWith("/productos/editar") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/productos", req.url));
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
    "/productos/:path*",
    "/inventario/:path*",
    "/ventas/:path*",
    "/usuarios/:path*",
    "/perfil/:path*",
  ],
};
