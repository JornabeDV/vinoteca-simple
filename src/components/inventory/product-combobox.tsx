"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search, Wine, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [search, setSearch] = React.useState("");
  const [isMobile, setIsMobile] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const filteredProducts = React.useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) =>
      [p.name, p.brand, p.style].some((field) =>
        field?.toLowerCase().includes(q)
      )
    );
  }, [products, search]);

  const handleSelect = (productId: string) => {
    onChange(productId === value ? "" : productId);
    setOpen(false);
    setSearch("");
  };

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between h-10 max-sm:h-12 font-normal mb-0"
      onClick={() => setOpen(true)}
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
    </Button>
  );

  const listContent = (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-popover z-10 border-b border-border/50 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Nombre, marca o estilo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
            autoFocus
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filteredProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No se encontraron productos.
          </p>
        ) : (
          <div className="space-y-1">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleSelect(product.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors",
                  value === product.id ? "bg-muted" : "hover:bg-muted"
                )}
              >
                <Wine className="h-4 w-4 shrink-0 text-[#7b1f3a]" />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-medium">{product.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {product.brand} · {product.style} · {product.currentStock} u.
                  </span>
                </div>
                <Check
                  className={cn(
                    "ml-auto h-4 w-4 shrink-0",
                    value === product.id ? "opacity-100" : "opacity-0"
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {isMobile ? (
        <>
          {triggerButton}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent showCloseButton={false} className="fixed inset-0 top-0 left-0 m-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0 p-0 flex flex-col overflow-hidden sm:inset-auto sm:top-1/2 sm:left-1/2 sm:m-auto sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl sm:border">
              <DialogHeader className="px-4 py-3 border-b border-border/50 flex-row items-center justify-between gap-4">
                <DialogTitle className="font-heading text-base">
                  Seleccionar producto
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setOpen(false)}
                  className="shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">{listContent}</div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={triggerButton}
          />
          <PopoverContent
            className="max-w-[95vw] p-0"
            align="start"
            side="bottom"
            style={{ width }}
          >
            <Command
              filter={(value, search) => {
                const product = products.find((p) => p.id === value);
                if (!product) return 0;
                const haystack = [product.name, product.brand, product.style]
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
                          value === product.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
