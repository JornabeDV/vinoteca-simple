"use client";

import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { useState } from "react";
import { deleteEmployee } from "@/lib/auth-actions";

export function DeleteUserButton({
  userId,
  userName,
  ownerId,
  businessId,
}: {
  userId: string;
  userName: string;
  ownerId: string;
  businessId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleConfirm() {
    setIsLoading(true);
    try {
      await deleteEmployee(userId, ownerId, businessId);
      toast.success("Empleado eliminado correctamente");
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar el empleado");
      setIsLoading(false);
    }
  }

  return (
    <ConfirmDialog
      title="Eliminar empleado"
      description={`¿Estás seguro de que querés eliminar a "${userName}"? Esta acción no se puede deshacer.`}
      confirmText="Eliminar"
      cancelText="Cancelar"
      variant="destructive"
      isLoading={isLoading}
      onConfirm={handleConfirm}
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      }
    />
  );
}
