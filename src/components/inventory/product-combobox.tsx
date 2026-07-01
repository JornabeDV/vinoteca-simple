"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Wine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Product {
  id: string;
  name: string;
  brand: string;
  style: string;
  currentStock: number;
}

interface ProductComboboxProps {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ProductCombobox({
  products,
  value,
  onChange,
  placeholder = "Buscar producto...",
}: ProductComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedProduct = products.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 font-normal"
          />
        }
      >
        {selectedProduct ? (
          <span className="truncate">
            {selectedProduct.name}{" "}
            <span className="text-muted-foreground">
              ({selectedProduct.currentStock} u.)
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popper-anchor-width] max-w-[95vw] p-0" align="start">
        <Command
          filter={(value, search) => {
            const product = products.find((p) => p.id === value);
            if (!product) return 0;
            const haystack = [
              product.name,
              product.brand,
              product.style,
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Nombre, marca o estilo..." />
          <CommandList>
            <CommandEmpty>No se encontraron productos.</CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Wine className="mr-2 h-4 w-4 shrink-0 text-[#7b1f3a]" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate font-medium">
                      {product.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {product.brand} · {product.style} ·{" "}
                      {product.currentStock} u.
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      value === product.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
