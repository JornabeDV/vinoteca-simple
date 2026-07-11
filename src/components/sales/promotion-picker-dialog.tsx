"use client";

import { useState, useEffect, useMemo } from "react";
import { Wine, Check, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatPrice } from "@/lib/utils";

interface PromotionPickerDialogProps {
  promotion: any;
  trigger: React.ReactElement;
  onConfirm: (items: { productId: string; quantity: number }[]) => void;
}

export function PromotionPickerDialog({ promotion, trigger, onConfirm }: PromotionPickerDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const eligibleItems = promotion.items || [];
  const required = promotion.requiredItemCount || 0;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return eligibleItems;
    const q = search.toLowerCase();
    return eligibleItems.filter((item: any) => {
      const product = item.product;
      return [product?.name, product?.brand, product?.style]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q));
    });
  }, [eligibleItems, search]);

  function toggleProduct(productId: string) {
    setSelectedIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      if (prev.length >= required) {
        return prev;
      }
      return [...prev, productId];
    });
  }

  function handleConfirm() {
    if (selectedIds.length !== required) return;
    onConfirm(selectedIds.map((id) => ({ productId: id, quantity: 1 })));
    setSelectedIds([]);
    setSearch("");
    setOpen(false);
  }

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      setSelectedIds([]);
      setSearch("");
    }
    setOpen(newOpen);
  }

  const listContent = (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="sticky top-0 bg-popover z-10 border-b border-border/50 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9"
            autoFocus={isMobile}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No se encontraron productos.
          </p>
        ) : (
          <div className="space-y-1">
            {filteredItems.map((item: any) => {
              const product = item.product;
              const checked = selectedIds.includes(item.productId);
              const outOfStock = !product || product.currentStock <= 0;

              return (
                <div
                  key={item.productId}
                  onClick={() => !outOfStock && toggleProduct(item.productId)}
                  className={cn(
                    "flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors",
                    outOfStock
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted cursor-pointer"
                  )}
                >
                  <div className="pt-0.5">
                    <Checkbox
                      checked={checked}
                      disabled={outOfStock}
                      onCheckedChange={() => toggleProduct(item.productId)}
                    />
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                    {product?.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-8 w-8 rounded-md object-cover"
                      />
                    ) : (
                      <Wine className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium", isMobile ? "line-clamp-2" : "truncate")}>
                      {product?.name || "Producto"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[product?.brand, product?.style].filter(Boolean).join(" · ")}
                      {product?.currentStock > 0
                        ? ` · ${product.currentStock} disp.`
                        : " · Sin stock"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} nativeButton={false} />
      <DialogContent
        showCloseButton={isMobile ? false : true}
        className={cn(
          "flex flex-col overflow-hidden p-0",
          isMobile
            ? "fixed inset-0 top-0 left-0 m-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-0"
            : "sm:max-w-lg max-h-[90vh]"
        )}
      >
        <DialogHeader
          className={cn(
            "px-4 py-3 border-b border-border/50 flex-row items-center justify-between gap-4",
            isMobile ? "shrink-0" : ""
          )}
        >
          <div className="min-w-0">
            <DialogTitle className="font-heading truncate">{promotion.name}</DialogTitle>
            <DialogDescription>
              Elegí {required} productos para armar esta promo.
            </DialogDescription>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </DialogHeader>

        <div className={cn("flex-1 overflow-hidden", isMobile ? "" : "p-4")}>
          {!isMobile && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#7b1f3a]">
                {formatPrice(Number(promotion.salePrice))}
              </span>
              <Badge variant={selectedIds.length === required ? "default" : "secondary"}>
                {selectedIds.length} de {required}
              </Badge>
            </div>
          )}

          <div
            className={cn(
              "overflow-hidden",
              isMobile ? "h-full" : "h-72 rounded-lg border border-border/50"
            )}
          >
            {listContent}
          </div>
        </div>

        <DialogFooter
          className={cn(
            "px-4 py-3 border-t border-border/50",
            isMobile ? "shrink-0" : ""
          )}
        >
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="max-sm:mx-4 max-sm:order-2"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.length !== required}
            className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white max-sm:mx-4 sm:mr-4 mb-4 max-sm:order-1"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
