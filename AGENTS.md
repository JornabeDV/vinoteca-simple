# AGENTS.md — Vinoteca Simple

Este documento contiene la información esencial para agentes de código que trabajen en el proyecto.

---

## 1. Arquitectura del Producto

Vinoteca Simple sigue una arquitectura **monolito modular** sobre Next.js 15 con App Router:

```
┌─────────────────────────────────────────┐
│           Next.js 15 (App Router)       │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │  Pages  │ │  API    │ │  Actions │  │
│  │ (RSC)   │ │ Routes  │ │ (Server) │  │
│  └────┬────┘ └────┬────┘ └────┬─────┘  │
│       │           │           │         │
│  ┌────┴───────────┴───────────┴─────┐   │
│  │         Prisma ORM 7              │   │
│  │   (PostgreSQL + pg adapter)       │   │
│  └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

- **Rendering:** Server Components por defecto. Client Components solo para interactividad (forms, dialogs, charts).
- **Data Fetching:** Server Actions para mutaciones, queries directas en Server Components.
- **Auth:** NextAuth.js v4 con Credentials Provider + JWT strategy.

---

## 2. Arquitectura de Información

```
Vender (Home)
├── Nueva venta (checkout rápido)
├── Historial de ventas
│   └── Detalle de venta
├── Productos
│   ├── Listado con búsqueda/filtros
│   ├── Crear producto
│   └── Editar producto
├── Promos
│   ├── Listado con búsqueda/filtros
│   ├── Crear promo (combo de productos + precio)
│   └── Editar promo
├── Inventario
│   ├── Productos activos
│   ├── Alertas de stock bajo
│   └── Historial de movimientos
├── Clientes (solo OWNER)
├── Categorías (solo OWNER)
├── Panel general (solo OWNER)
├── Usuarios (solo OWNER)
└── Perfil
```

---

## 3. Estructura de Navegación

Sidebar fija en desktop (72px), drawer en mobile.

```
[Logo] Vinoteca Simple
├── Vender       [default landing]
├── Historial
├── Productos
├── Promos
├── Inventario
├── Clientes     [OWNER only]
├── Categorías   [OWNER only]
├── Panel general [OWNER only]
├── Usuarios     [OWNER only]
└── Cerrar sesión
```

Header sticky con:
- Título de página dinámico
- Menú de usuario (avatar, perfil, logout)

---

## 4. Flujos de Usuario

### Flujo de Venta (prioritario)
1. Usuario entra a la app y aterriza directamente en "Vender"
2. Busca producto por nombre/bodega/categoría
3. Si no lo encuentra, el dueño puede crearlo rápido sin salir de la pantalla de venta
4. Selecciona producto → se agrega al carrito
5. Ajusta cantidades (+/-)
6. Confirma venta
7. Sistema: crea sale, items, deduce stock, registra movimiento

### Flujo de Producto
1. Usuario va a "Productos" → "Nuevo Producto"
2. Completa formulario de 3 secciones (info básica, precios, inventario)
3. Guarda → redirige al listado

### Flujo de Inventario
1. Usuario va a "Inventario"
2. Abre "Ajustar Stock"
3. Selecciona producto, tipo de movimiento, cantidad
4. Guarda → actualiza stock y registra movimiento

---

## 5. Estrategia UX

- **Primera regla:** Minimizar clicks. Cada flujo debe completarse en ≤3 pasos cuando sea posible.
- **Empty states:** Siempre mostrar ilustración/icono + mensaje + CTA (nunca pantalla en blanco).
- **Feedback inmediato:** Sonner toasts para todas las mutaciones.
- **Defaults inteligentes:** Stock inicial = 0, status = ACTIVE.
- **Mobile-first responsive:** Sidebar colapsable, tablas scrollables, touch targets ≥44px.

---

## 6. Estrategia UI

### Paleta de Colores
```css
--background: #faf9f7       /* Fondo cálido */
--foreground: #1c1917       /* Texto principal */
--primary: #7b1f3a          /* Vino (acento) */
--primary-foreground: #faf9f7
--secondary: #f5f0eb        /* Superficies secundarias */
--muted: #f5f0eb
--border: #e7e5e4
--destructive: #dc2626
--wine-light: #a8455f
--wine-dark: #5a1530
```

### Tipografía
- **Headings:** Playfair Display (serif elegante)
- **Body:** DM Sans (sans legible)
- **Scale:** base 16px, line-height 1.5

### Componentes Clave
- Cards con `border-border/50` y `hover:shadow-md`
- Tablas con filas `group` y acciones `opacity-0 group-hover:opacity-100`
- Badges para estados (ACTIVE/ARCHIVED, stock bajo)
- KPI cards con iconos en cajas de color sutil

---

## 7. Sistema de Diseño (Tokens)

| Token | Valor |
|-------|-------|
| `--radius` | 0.625rem |
| `--radius-sm` | calc(var(--radius) * 0.6) |
| `--radius-lg` | var(--radius) |
| `--radius-xl` | calc(var(--radius) * 1.4) |
| Font Sans | var(--font-dm-sans) |
| Font Heading | var(--font-playfair) |

---

## 8. Diseño de Base de Datos

### Tablas y Relaciones

```
users (1) ───< (N) sales
users (1) ───< (N) inventory_movements

wine_products (1) ───< (N) sale_items
wine_products (1) ───< (N) inventory_movements

sales (1) ───< (N) sale_items
```

### Índices
- `wine_products`: status, name, winery, category
- `inventory_movements`: productId, userId, createdAt
- `sales`: userId, createdAt
- `sale_items`: saleId, productId

### Convenciones
- UUID v4 como PK
- `created_at` / `updated_at` en todas las tablas
- Precios en `Decimal(10,2)`
- Nombres de tablas en snake_case con `@map()`

---

## 9. Esquema Prisma

Ver `prisma/schema.prisma`.

Resumen de enums:
- `UserRole`: OWNER | EMPLOYEE
- `ProductStatus`: ACTIVE | ARCHIVED
- `MovementType`: PURCHASE | SALE | ADJUSTMENT | CORRECTION

---

## 10. Jerarquía de Componentes

```
RootLayout
└── AppShell (server, auth-guarded)
    ├── Header (client)
    │   ├── SidebarTrigger (mobile)
    │   └── UserDropdown (client)
    ├── Sidebar (client)
    │   └── NavLinks
    └── Main Content
        ├── NewSalePage (client) [default landing]
        │   ├── ProductSearch
        │   ├── QuickProductDialog (OWNER only)
        │   ├── Cart
        │   └── SaleSummary
        ├── SalesPage (client)
        │   └── SaleDetail (server)
        ├── ProductsPage (client)
        │   └── DataTable
        ├── ProductForm (client)
        ├── PromosPage (client)
        │   └── PromotionForm
        ├── InventoryPage (client)
        │   ├── ProductStockTable
        │   ├── LowStockPanel
        │   └── MovementHistory
        ├── DashboardPage (client) [OWNER only, /dashboard]
        │   ├── KpiCards
        │   ├── SalesChart (Recharts)
        │   ├── LowStockAlert
        │   └── RecentSales
        └── UsersPage (client) [OWNER only]
```

---

## 11. Estructura de Carpetas

```
src/
├── app/                    # Rutas Next.js App Router
│   ├── page.tsx            # Dashboard
│   ├── login/page.tsx      # Auth
│   ├── productos/
│   ├── promos/
│   ├── inventario/
│   ├── ventas/
│   ├── usuarios/
│   ├── perfil/
│   └── api/auth/[...nextauth]/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # AppShell, Header, Sidebar
│   ├── dashboard/          # DashboardPage, SalesChart
│   ├── products/           # ProductsPage, ProductForm
│   ├── promos/             # PromosPage, PromotionForm
│   ├── inventory/          # InventoryPage
│   └── sales/              # SalesPage, NewSalePage, EditSalePage
├── lib/
│   ├── prisma.ts           # Cliente Prisma con adapter pg
│   ├── auth.ts             # NextAuth config
│   ├── session.ts          # getSession / getCurrentUser
│   ├── actions.ts          # Server Actions (CRUD)
│   └── utils.ts            # cn, formatPrice, formatNumber
├── types/
│   └── next-auth.d.ts      # Extensión de tipos
└── middleware.ts           # Route protection + RBAC
```

---

## 12. Roadmap MVP

| Fase | Tarea | Estado |
|------|-------|--------|
| 1 | Setup proyecto (Next.js + shadcn + Prisma) | ✅ |
| 2 | Configurar base de datos y migraciones | ✅ |
| 3 | Implementar autenticación (NextAuth) | ✅ |
| 4 | Crear layout y navegación | ✅ |
| 5 | Dashboard con KPIs y charts | ✅ |
| 6 | CRUD de productos | ✅ |
| 7 | Gestión de inventario | ✅ |
| 8 | Registro de ventas | ✅ |
| 9 | Promociones / combos | ✅ |
| 10 | Seed de datos de prueba | ✅ |
| 11 | Build y validación | ✅ |

---

## 13. Plan de Implementación

### Convenciones de Código
- **TypeScript estricto** habilitado
- **Server Components** por defecto. Añadir `"use client"` solo cuando se necesite:
  - useState/useEffect
  - Event handlers del browser
  - Hooks de NextAuth (useSession)
- **Server Actions** en `lib/actions.ts` para toda la lógica de mutación
- **Revalidación** con `revalidatePath` después de mutaciones

### Patrones Reutilizables
```tsx
// Page pattern (server)
export default async function Page() {
  const data = await getData();
  return <ClientComponent data={data} />;
}

// Action pattern
"use server";
export async function createX(data: FormData) {
  // validate
  // mutate
  // revalidatePath("/route");
}
```

### Reglas de Estilo
- Usar `font-heading` para títulos (Playfair Display)
- Colores de acento: `#7b1f3a` para primary, `#5a1530` para hover
- Spacing: usar las utilidades de Tailwind (evitar valores arbitrarios)
- Responsive: mobile-first con `sm:`, `lg:` breakpoints

---

## 14. Recomendaciones de Escalabilidad

### Corto Plazo (3-6 meses)
1. **Multi-tenancy:** Agregar `shopId` a todas las entidades para soportar múltiples vinotecas
2. **Soft deletes:** Reemplazar deletes por `deletedAt` timestamps
3. **Paginación:** Implementar cursor-based pagination en tablas grandes
4. **Search:** Integrar Algolia o Meilisearch para búsqueda full-text

### Mediano Plazo (6-12 meses)
1. **API pública:** GraphQL o REST API para integraciones
2. **Notificaciones:** WebPush + email (Resend/SendGrid)
3. **Reportes:** Generación de PDFs con Puppeteer + export CSV
4. **PWA:** Service worker para offline support

### Largo Plazo (1+ año)
1. **Multi-sucursal:** Soporte para cadenas de vinotecas
2. **Marketplace B2B:** Portal para proveedores
3. **App nativa:** React Native o Flutter
4. **IA:** Recomendaciones de compra basadas en historial

---

## Notas para Agentes

- **No agregar features fuera del scope actual** sin consultar al usuario.
- **Mantener la simplicidad:** Este es un MVP para vender a las primeras 10 vinotecas.
- **Calidad visual > cantidad de features:** Cada pantalla debe sentirse premium.
- **Probar el build localmente** antes de considerar una tarea como terminada.
- **Variables de entorno sensibles** van en `.env` (nunca en el código).
