import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";
import { checkRateLimit } from "./lib/rate-limit";

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function authRateLimit(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (
    req.method === "POST" &&
    (path === "/api/auth/callback/credentials" || path.startsWith("/api/auth/signin"))
  ) {
    const ip = getClientIp(req);
    const result = checkRateLimit(`login:${ip}`);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Volvé a intentar más tarde." },
        { status: 429 }
      );
    }
  }
  return null;
}

export default withAuth(
  function middleware(req) {
    const rateLimitResponse = authRateLimit(req);
    if (rateLimitResponse) return rateLimitResponse;

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
    if (path.startsWith("/productos/actualizar-precios") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/productos", req.url));
    }
    if (path.startsWith("/promos") && token?.role !== "OWNER") {
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
    if (path.startsWith("/mi-vinoteca") && token?.role !== "OWNER") {
      return NextResponse.redirect(new URL("/ventas/nueva", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        // Public auth endpoints must be reachable for rate limiting to apply.
        const path = req.nextUrl.pathname;
        if (
          path.startsWith("/api/auth/") ||
          path === "/login" ||
          path === "/registro" ||
          path === "/unirse"
        ) {
          return true;
        }
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
    "/promos/:path*",
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
    "/api/auth/:path*",
  ],
};
