export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string | "center";
  route?: string;
  placement: TourPlacement;
}

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a Vinoteca Simple!",
    description:
      "En menos de 2 minutos vas a conocer las herramientas principales para gestionar tu vinoteca. ¡Empecemos!",
    target: "center",
    route: "/",
    placement: "center",
  },
  {
    id: "sidebar-productos",
    title: "Tu Catálogo de Vinos",
    description:
      "Acá accedés a tu catálogo. Podés agregar, editar y organizar todo el inventario de tu vinoteca.",
    target: '[data-tour="nav-productos"]',
    route: "/",
    placement: "right",
  },
  {
    id: "productos-page",
    title: "Listado de Productos",
    description:
      "Este es tu listado de productos. Empezá creando tu primer vino o, si ya tenés una planilla, usá el botón de importación masiva.",
    target: '[data-tour="productos-nuevo"]',
    route: "/productos",
    placement: "bottom",
  },
  {
    id: "importar-excel",
    title: "Importación Masiva",
    description:
      "¿Tenés todo en Excel? Arrastrá el archivo o pegá los datos para cargar tu inventario completo en segundos.",
    target: '[data-tour="productos-importar"]',
    route: "/productos",
    placement: "bottom",
  },
  {
    id: "inventario",
    title: "Control de Stock",
    description:
      "Desde acá controlás el stock. Podés ajustar cantidades, ver alertas de faltante y el historial de movimientos.",
    target: '[data-tour="inventario-ajustar"]',
    route: "/inventario",
    placement: "bottom",
  },
  {
    id: "ventas",
    title: "Registrar Ventas",
    description:
      "Registrar una venta es muy simple. Buscás el producto, agregás al carrito y confirmás. El stock se descuenta automáticamente.",
    target: '[data-tour="ventas-nueva"]',
    route: "/ventas",
    placement: "bottom",
  },
  {
    id: "dashboard-kpis",
    title: "Panel General",
    description:
      "Volvé al Panel General para ver tus KPIs en tiempo real: ventas del día, semana, mes y ticket promedio.",
    target: '[data-tour="dashboard-kpis"]',
    route: "/",
    placement: "bottom",
  },
  {
    id: "complete",
    title: "¡Listo para empezar!",
    description:
      "Ya conocés las herramientas principales. Si necesitás ayuda, siempre podés repetir este recorrido desde tu perfil.",
    target: "center",
    route: "/",
    placement: "center",
  },
];

export const STORAGE_KEY = "vinoteca-tour";

export interface TourState {
  stepIndex: number;
  isActive: boolean;
  completed: boolean;
}

export function getInitialTourState(): TourState {
  if (typeof window === "undefined") {
    return { stepIndex: 0, isActive: false, completed: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return { stepIndex: 0, isActive: false, completed: false };
}

export function saveTourState(state: TourState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetTourState() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
