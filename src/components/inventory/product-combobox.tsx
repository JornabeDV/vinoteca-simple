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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [open]);

  const selectedProduct = products.find((p) => p.id === value);

  return (
    <div ref={containerRef} className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-10 max-sm:h-12 font-normal mb-0"
            />
          }
        >
          {selectedProduct ? (
            <div className="truncate min-w-0 text-left">
              {selectedProduct.name}{" "}
              <span className="text-muted-foreground">
                ({selectedProduct.currentStock} u.)
              </span>
            </div>
          ) : (
            <div className="text-muted-foreground text-left truncate min-w-0">
              {placeholder}
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent
          className="max-w-[95vw] p-0"
          align="start"
          style={{ width }}
        >
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
    </div>
  );
}
