/**
 * Convierte objetos Decimal de Prisma a number recursivamente,
 * preservando Dates y otros valores primitivos.
 */
function isDecimal(value: unknown): value is { toNumber(): number } {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    "toNumber" in value &&
    typeof (value as Record<string, unknown>).toNumber === "function"
  );
}

export function serializeData<T>(obj: T): T {
  if (isDecimal(obj)) {
    return (obj as { toNumber(): number }).toNumber() as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeData) as unknown as T;
  }

  if (obj && typeof obj === "object") {
    if (obj instanceof Date) {
      return obj;
    }

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeData(value);
    }
    return result as unknown as T;
  }

  return obj;
}
