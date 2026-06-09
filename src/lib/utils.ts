import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string | Decimal): string {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-AR").format(num);
}

type Decimal = { toNumber(): number };
