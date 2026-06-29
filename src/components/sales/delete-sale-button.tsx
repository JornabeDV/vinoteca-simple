"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { deleteSale } from "@/lib/actions";
import { toast } from "sonner";

interface DeleteSaleButtonProps {
  saleId: string;
  saleNumber: string;
  variant?: "icon" | "button";
}

export function DeleteSaleButton({
  saleId,
  saleNumber,
  variant = "icon",
}: DeleteSaleButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await deleteSale(saleId);
      toast.success("Venta eliminada");
      router.push("/ventas");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar la venta");
      setIsLoading(false);
    }
  }

  const trigger =
    variant === "button" ? (
      <Button
        variant="outline"
        className="gap-2 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        Eliminar
      </Button>
    ) : (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Eliminar venta</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

  return (
    <ConfirmDialog
      title="Eliminar venta"
      description={`¿Estás seguro de que querés eliminar la venta ${saleNumber}? Se revertirá el stock de los productos. Esta acción no se puede deshacer.`}
      confirmText="Eliminar"
      cancelText="Cancelar"
      variant="destructive"
      isLoading={isLoading}
      onConfirm={handleConfirm}
      trigger={trigger}
    />
  );
}
