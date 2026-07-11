"use client";

import { useState } from "react";
import { Wine, Check } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const eligibleItems = promotion.items || [];
  const required = promotion.requiredItemCount || 0;

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
    setOpen(false);
  }

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      setSelectedIds([]);
    }
    setOpen(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} nativeButton={false} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{promotion.name}</DialogTitle>
          <DialogDescription>
            Elegí {required} productos para armar esta promo.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-[#7b1f3a]">
              {formatPrice(Number(promotion.salePrice))}
            </span>
            <Badge variant={selectedIds.length === required ? "default" : "secondary"}>
              {selectedIds.length} de {required}
            </Badge>
          </div>

          <ScrollArea className="h-72 rounded-lg border border-border/50 p-2">
            <div className="space-y-1">
              {eligibleItems.map((item: any) => {
                const product = item.product;
                const checked = selectedIds.includes(item.productId);
                const outOfStock = !product || product.currentStock <= 0;

                return (
                  <div
                    key={item.productId}
                    onClick={() => !outOfStock && toggleProduct(item.productId)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2 py-2 transition-colors",
                      outOfStock
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-muted cursor-pointer"
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={outOfStock}
                      onCheckedChange={() => toggleProduct(item.productId)}
                    />
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
                      <p className="text-sm font-medium truncate">{product?.name || "Producto"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[product?.brand, product?.style].filter(Boolean).join(" · ")}
                        {product?.currentStock > 0 ? ` · ${product.currentStock} disp.` : " · Sin stock"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.length !== required}
            className="bg-[#7b1f3a] hover:bg-[#5a1530] text-white"
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
