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

export const paymentMethodLabels: Record<string, string> = {
  CASH: "Efectivo",
  CREDIT_CARD: "Crédito",
  DEBIT_CARD: "Débito",
  TRANSFER: "Transferencia",
  DIGITAL_WALLET: "Billetera digital",
  ACCOUNT: "Cuenta corriente",
};

export function getPaymentMethodLabel(method?: string | null): string {
  return paymentMethodLabels[method || ""] || method || "—";
}

export const productTypeLabels: Record<string, string> = {
  WINE: "Vino",
  BEER: "Cerveza",
  SPIRIT: "Destilado",
  WATER: "Agua",
  NON_ALCOHOLIC: "Bebida sin alcohol",
  OTHER: "Otro",
};

export function getProductTypeLabel(type?: string | null): string {
  return productTypeLabels[type || ""] || type || "—";
}

/**
 * Escape a CSV field to mitigate CSV injection attacks. Fields starting with
 * formula-triggering characters ('=', '+', '-', '@', '\t', '\r') are prefixed
 * with a single quote so spreadsheet applications treat them as text.
 */
export function escapeCsvField(value: unknown): string {
  const str = String(value ?? "");
  if (/^[+=\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

type Decimal = { toNumber(): number };
