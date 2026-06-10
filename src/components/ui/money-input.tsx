"use client";

import * as React from "react";
import { NumericFormat } from "react-number-format";
import { cn } from "@/lib/utils";

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue" | "type"> {
  defaultValue?: number | string;
  onChange?: (value: number) => void;
}

/** Formatea un número al estilo argentino: 1234.56 → "1.234,56" */
export function formatMoney(value: number | string | undefined): string {
  if (value === undefined || value === null || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/** Convierte "1.234,56" → 1234.56 */
export function parseMoney(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, defaultValue, onChange, name, id, disabled, placeholder, required }, ref) => {
    const [numericValue, setNumericValue] = React.useState<number | undefined>(() => {
      if (defaultValue === undefined || defaultValue === null || defaultValue === "") return undefined;
      const num = typeof defaultValue === "string" ? parseFloat(defaultValue) : defaultValue;
      return isNaN(num) ? undefined : num;
    });

    const handleValueChange = (values: { floatValue?: number; value: string }) => {
      setNumericValue(values.floatValue);
      onChange?.(values.floatValue ?? 0);
    };

    return (
      <div className="relative w-full">
        <NumericFormat
          getInputRef={ref}
          id={id}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          value={numericValue}
          onValueChange={handleValueChange}
          decimalSeparator=","
          thousandSeparator="."
          decimalScale={2}
          allowNegative={false}
          fixedDecimalScale={false}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        />
        {name && (
          <input type="hidden" name={name} value={numericValue ?? ""} />
        )}
      </div>
    );
  }
);
MoneyInput.displayName = "MoneyInput";
