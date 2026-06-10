export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string | "center";
  placement: TourPlacement;
}

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a Vinoteca Simple!",
    description:
      "En un minuto vas a conocer las herramientas principales para gestionar tu vinoteca.",
    target: "center",
    placement: "center",
  },
  {
    id: "nav-dashboard",
    title: "Panel General",
    description:
      "Acá tenés un resumen completo de tu negocio: ventas del día, semana, mes, ticket promedio y alertas de stock.",
    target: '[data-tour-desktop="nav-dashboard"]',
    placement: "right",
  },
  {
    id: "nav-productos",
    title: "Productos",
    description:
      "Gestioná tu catálogo de vinos. Podés crear productos uno por uno o importar todo tu inventario desde Excel en segundos.",
    target: '[data-tour-desktop="nav-productos"]',
    placement: "right",
  },
  {
    id: "nav-inventario",
    title: "Inventario",
    description:
      "Controlá el stock de cada producto. Ajustá cantidades, recibí alertas de faltante y consultá el historial de movimientos.",
    target: '[data-tour-desktop="nav-inventario"]',
    placement: "right",
  },
  {
    id: "nav-ventas",
    title: "Ventas",
    description:
      "Registrá ventas de forma simple. Buscás el producto, agregás al carrito y confirmás. El stock se descuenta automáticamente.",
    target: '[data-tour-desktop="nav-ventas"]',
    placement: "right",
  },
  {
    id: "nav-usuarios",
    title: "Usuarios",
    description:
      "Como dueño, podés invitar empleados para que usen la app. Cada uno accede con su propia cuenta.",
    target: '[data-tour-desktop="nav-usuarios"]',
    placement: "right",
  },
  {
    id: "header-perfil",
    title: "Tu Perfil",
    description:
      "Desde acá accedés a tu perfil, podés cambiar tu contraseña o cerrar sesión cuando quieras.",
    target: '[data-tour="header-perfil"]',
    placement: "bottom",
  },
  {
    id: "dashboard-kpis",
    title: "Tus Números",
    description:
      "Estos indicadores te muestran el estado de tu negocio en tiempo real. Filtrá por período para ver tendencias.",
    target: '[data-tour="dashboard-kpis"]',
    placement: "bottom",
  },
  {
    id: "complete",
    title: "¡Listo para empezar!",
    description:
      "Ya conocés las herramientas principales. Si necesitás ayuda, podés repetir este recorrido desde tu perfil.",
    target: "center",
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
