# Vinoteca Simple

**La forma más simple de administrar tu vinoteca.**

Vinoteca Simple es una plataforma SaaS moderna para la gestión de vinotecas y negocios de vinos. Reemplaza hojas de cálculo, registros en papel y sistemas informales con una experiencia digital premium, intuitiva y escalable.

---

## 🚀 Características del MVP

| Módulo | Funcionalidades |
|--------|----------------|
| **Autenticación** | Login, logout, recuperación de contraseña, roles (Owner / Empleado) |
| **Dashboard** | KPIs en tiempo real, tendencias de ventas, productos más vendidos, alertas de stock |
| **Productos** | CRUD completo, búsqueda, filtros, archivado, imágenes |
| **Inventario** | Ajustes de stock, historial de movimientos, alertas de stock bajo |
| **Ventas** | Registro rápido de ventas, detalle de transacciones, deducción automática de stock |
| **Usuarios** | Gestión de equipo con control de acceso basado en roles |

---

## 🛠️ Stack Tecnológico

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Frontend:** React 19, TypeScript, TailwindCSS v4
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Backend:** Next.js Server Actions + API Routes
- **Base de datos:** PostgreSQL (Neon recomendado para producción)
- **ORM:** [Prisma 7](https://www.prisma.io/)
- **Autenticación:** [NextAuth.js v4](https://next-auth.js.org/) (Credentials Provider)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Deployment:** [Vercel](https://vercel.com/)

---

## ⚡ Inicio Rápido

### Prerrequisitos

- Node.js 20+
- PostgreSQL 14+ (local o en la nube)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd vinoteca-simple

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Copiar .env.example a .env y completar los valores

# 4. Ejecutar migraciones de base de datos
npx prisma migrate dev

# 5. Cargar datos de prueba
npx tsx prisma/seed.ts

# 6. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`.

### Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Propietario | `owner@Vinoteca Simple.com` | `owner123` |
| Empleado | `empleado@Vinoteca Simple.com` | `empleado123` |

---

## 📁 Estructura del Proyecto

```
vinoteca-simple/
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   ├── seed.ts                # Datos iniciales
│   └── migrations/            # Migraciones de Prisma
├── src/
│   ├── app/                   # App Router (Next.js 15)
│   │   ├── (routes)/          # Páginas principales
│   │   ├── api/auth/          # API de autenticación
│   │   └── layout.tsx         # Layout raíz
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   ├── layout/            # Shell, sidebar, header
│   │   ├── dashboard/         # KPIs y gráficos
│   │   ├── products/          # Tabla y formulario de productos
│   │   ├── inventory/         # Gestión de inventario
│   │   └── sales/             # Registro y lista de ventas
│   ├── lib/
│   │   ├── prisma.ts          # Cliente Prisma
│   │   ├── auth.ts            # Configuración de NextAuth
│   │   ├── session.ts         # Helpers de sesión
│   │   ├── actions.ts         # Server Actions
│   │   └── utils.ts           # Utilidades
│   ├── types/
│   │   └── next-auth.d.ts     # Tipos extendidos de NextAuth
│   └── middleware.ts          # Protección de rutas
├── .env                       # Variables de entorno
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🗄️ Esquema de Base de Datos

### Entidades Principales

- **users** — Usuarios del sistema (propietarios y empleados)
- **wine_products** — Catálogo de vinos y productos
- **inventory_movements** — Registro de todos los movimientos de stock
- **sales** — Transacciones de venta
- **sale_items** — Líneas de cada venta

Ver `prisma/schema.prisma` para la definición completa con índices y relaciones.

---

## 🎨 Sistema de Diseño

- **Tipografía:** Playfair Display (títulos) + DM Sans (cuerpo)
- **Paleta:** Fondo cálido `#faf9f7`, acento vino `#7b1f3a`, superficies blancas
- **Radio:** 0.625rem base con escalado coherente
- **Principios:** Minimalismo premium, espaciado generoso, jerarquía clara

---

## 📝 Roadmap

### MVP (Actual)
- [x] Autenticación y roles
- [x] Dashboard con analytics
- [x] Gestión de productos
- [x] Control de inventario
- [x] Registro de ventas

### Próximas Versiones
- [ ] Gestión de proveedores
- [ ] Reportes exportables (PDF/Excel)
- [ ] Múltiples sucursales
- [ ] App móvil (PWA)
- [ ] Integración con sistemas de facturación
- [ ] Programa de fidelización

---

## 📄 Licencia

Proyecto privado — Vinoteca Simple.
